"""
FastAPI メインアプリケーション
"""
from fastapi import FastAPI, Request, Form, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import Optional
import os

from app import data, store
from app.schemas import AnswerRequest, RemindRequest

app = FastAPI(title="内部研修デモアプリ")

# テンプレートと静的ファイルの設定
templates = Jinja2Templates(directory="app/templates")

# カスタムフィルターを追加
def round_filter(value, precision=0):
    """Jinja2用のroundフィルター"""
    try:
        return round(float(value), precision)
    except (ValueError, TypeError):
        return value

templates.env.filters["round"] = round_filter
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ==================== 受講者向け画面 ====================

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """名前入力とテーマ選択"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/quiz/{topic}", response_class=HTMLResponse)
async def quiz_page(
    request: Request,
    topic: str,
    name: Optional[str] = Query(None),
    show_result: Optional[str] = Query(None)
):
    """4択設問表示"""
    if not name:
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "message": "名前が指定されていません。トップページから名前を入力してください。"}
        )
    
    if topic not in ["governance", "harassment", "infosec"]:
        raise HTTPException(status_code=404, detail="Invalid topic")
    
    questions = data.get_questions_by_topic(topic)
    if not questions:
        raise HTTPException(status_code=404, detail="Questions not found")
    
    user = store.get_or_create_user(name)
    answered_question_ids = set(user.answers.keys())
    
    # 未回答の最初の設問を取得
    current_question = None
    question_index = 0
    for idx, q in enumerate(questions):
        if q.id not in answered_question_ids:
            current_question = q
            question_index = idx
            break
    
    # すべて回答済みの場合は結果ページにリダイレクト
    if current_question is None:
        return RedirectResponse(url=f"/result/{topic}?name={name}", status_code=303)
    
    # 前の設問の回答結果を取得（表示用）
    # show_resultパラメータがある場合、または前の設問が回答済みの場合
    previous_result = None
    if show_result or question_index > 0:
        # 最新の回答結果を取得（回答済みの設問のうち、現在の設問の前のもの）
        for idx in range(question_index - 1, -1, -1):
            prev_q = questions[idx]
            if prev_q.id in user.answers:
                selected = user.answers[prev_q.id]
                previous_result = {
                    "question": prev_q,
                    "selected_index": selected,
                    "is_correct": selected == prev_q.correct_index
                }
                break
    
    return templates.TemplateResponse(
        "quiz.html",
        {
            "request": request,
            "name": name,
            "topic": topic,
            "question": current_question,
            "question_index": question_index + 1,
            "total_questions": len(questions),
            "previous_result": previous_result
        }
    )


@app.post("/quiz/{topic}")
async def submit_answer(
    request: Request,
    topic: str,
    name: str = Form(...),
    question_id: str = Form(...),
    selected_index: int = Form(...)
):
    """回答送信"""
    if topic not in ["governance", "harassment", "infosec"]:
        raise HTTPException(status_code=404, detail="Invalid topic")
    
    try:
        question = data.get_question_by_id(question_id)
        store.save_answer(name, question_id, selected_index, question)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    # 同じページにリダイレクト（結果表示付き）
    return RedirectResponse(url=f"/quiz/{topic}?name={name}&show_result=1", status_code=303)


@app.get("/result/{topic}", response_class=HTMLResponse)
async def result_page(
    request: Request,
    topic: str,
    name: Optional[str] = Query(None)
):
    """スコアと誤答一覧"""
    if not name:
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "message": "名前が指定されていません。"}
        )
    
    if topic not in ["governance", "harassment", "infosec"]:
        raise HTTPException(status_code=404, detail="Invalid topic")
    
    user = store.get_user(name)
    if not user:
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "message": "ユーザーが見つかりません。"}
        )
    
    questions = data.get_questions_by_topic(topic)
    score = user.score_by_topic[topic]
    
    # 誤答一覧を作成
    incorrect_answers = []
    for q in questions:
        if q.id in user.answers:
            selected = user.answers[q.id]
            if selected != q.correct_index:
                incorrect_answers.append({
                    "question": q,
                    "selected_index": selected,
                    "selected_choice": q.choices[selected],
                    "correct_choice": q.choices[q.correct_index]
                })
    
    return templates.TemplateResponse(
        "result.html",
        {
            "request": request,
            "name": name,
            "topic": topic,
            "score": score,
            "total_questions": len(questions),
            "incorrect_answers": incorrect_answers
        }
    )


# ==================== 管理者向け画面 ====================

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    """受講者一覧と集計情報"""
    users = store.get_all_users()
    stats = store.get_topic_statistics()
    top_incorrect = store.get_top_incorrect_questions(limit=3)
    
    return templates.TemplateResponse(
        "admin.html",
        {
            "request": request,
            "users": users,
            "stats": stats,
            "top_incorrect": top_incorrect
        }
    )


@app.get("/admin/remind", response_class=HTMLResponse)
async def remind_page(request: Request):
    """リマインド送信フォーム"""
    users = store.get_all_users()
    # 未受講者を抽出
    not_started_users = []
    for user in users:
        if any(status == "not_started" for status in user.status_by_topic.values()):
            not_started_users.append(user)
    
    return templates.TemplateResponse(
        "remind.html",
        {
            "request": request,
            "users": not_started_users
        }
    )


@app.post("/admin/remind")
async def send_remind(request: Request):
    """リマインド実行"""
    form_data = await request.form()
    selected_names = form_data.getlist("selected_names")
    message = form_data.get("message")
    
    if not selected_names:
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "message": "送信先が選択されていません。"}
        )
    
    # 通知ログに記録
    for name in selected_names:
        store.add_notification_log(name, message=message)
    
    return RedirectResponse(url="/admin/logs", status_code=303)


@app.get("/admin/logs", response_class=HTMLResponse)
async def logs_page(request: Request):
    """通知ログ一覧"""
    logs = store.get_notification_logs()
    # 新しい順にソート
    logs.sort(key=lambda x: x.sent_at, reverse=True)
    
    return templates.TemplateResponse(
        "logs.html",
        {
            "request": request,
            "logs": logs
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

