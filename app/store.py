"""
インメモリデータストア
"""
from typing import Dict, List, Optional
from datetime import datetime
from app.schemas import Question
from app import data


class UserProgress:
    """ユーザーの進捗情報"""
    def __init__(self, name: str):
        self.name = name
        self.status_by_topic: Dict[str, str] = {
            "governance": "not_started",
            "harassment": "not_started",
            "infosec": "not_started"
        }
        self.answers: Dict[str, int] = {}  # question_id -> selected_index
        self.score_by_topic: Dict[str, Dict[str, int]] = {
            "governance": {"correct": 0, "total": 0},
            "harassment": {"correct": 0, "total": 0},
            "infosec": {"correct": 0, "total": 0}
        }
        self.updated_at: Optional[datetime] = None


class NotificationLog:
    """通知ログ"""
    def __init__(self, to_name: str, topic: Optional[str] = None, message: Optional[str] = None):
        self.sent_at = datetime.now()
        self.to_name = to_name
        self.topic = topic
        self.message = message or "リマインド通知を送信しました"


class ChatMessage:
    """チャットメッセージ"""
    def __init__(self, name: str, message: str, is_user: bool = True):
        self.timestamp = datetime.now()
        self.name = name
        self.message = message
        self.is_user = is_user
        self.answer = None  # 回答内容
        self.references = []  # 参照条文
        self.confidence = None  # 自信度


class Escalation:
    """エスカレーション"""
    def __init__(self, name: str, message: str, retrieved_articles: List[dict], confidence: str):
        self.id = len(_escalations) + 1
        self.created_at = datetime.now()
        self.name = name
        self.message = message
        self.retrieved_articles = retrieved_articles
        self.confidence = confidence
        self.status = "open"  # open / in_progress / closed
        self.updated_at = datetime.now()


# グローバルストア
_user_progress: Dict[str, UserProgress] = {}
_notification_logs: List[NotificationLog] = []
_chat_history: Dict[str, List[ChatMessage]] = {}  # name -> messages
_escalations: List[Escalation] = []


def get_or_create_user(name: str) -> UserProgress:
    """ユーザーを取得または作成"""
    if name not in _user_progress:
        _user_progress[name] = UserProgress(name)
    return _user_progress[name]


def get_user(name: str) -> Optional[UserProgress]:
    """ユーザーを取得"""
    return _user_progress.get(name)


def get_all_users() -> List[UserProgress]:
    """全ユーザーを取得"""
    return list(_user_progress.values())


def save_answer(name: str, question_id: str, selected_index: int, question: Question):
    """回答を保存し、スコアを更新"""
    user = get_or_create_user(name)
    user.answers[question_id] = selected_index
    user.updated_at = datetime.now()
    
    # スコア更新
    topic = question.topic
    user.score_by_topic[topic]["total"] += 1
    if selected_index == question.correct_index:
        user.score_by_topic[topic]["correct"] += 1
    
    # ステータス更新
    topic_questions = [q for q in data.QUESTIONS if q.topic == topic]
    answered_count = sum(1 for q in topic_questions if q.id in user.answers)
    if answered_count == len(topic_questions):
        user.status_by_topic[topic] = "completed"
    elif answered_count > 0:
        user.status_by_topic[topic] = "in_progress"


def add_notification_log(to_name: str, topic: Optional[str] = None, message: Optional[str] = None):
    """通知ログを追加"""
    log = NotificationLog(to_name, topic, message)
    _notification_logs.append(log)
    return log


def get_notification_logs() -> List[NotificationLog]:
    """通知ログを取得"""
    return _notification_logs.copy()


def get_topic_statistics() -> Dict[str, Dict[str, float]]:
    """テーマ別の統計情報を取得"""
    stats = {}
    for topic in ["governance", "harassment", "infosec"]:
        total_correct = 0
        total_questions = 0
        user_count = 0
        
        for user in _user_progress.values():
            if user.score_by_topic[topic]["total"] > 0:
                total_correct += user.score_by_topic[topic]["correct"]
                total_questions += user.score_by_topic[topic]["total"]
                user_count += 1
        
        avg_score = (total_correct / total_questions * 100) if total_questions > 0 else 0.0
        stats[topic] = {
            "average": avg_score,
            "user_count": user_count
        }
    
    return stats


def get_top_incorrect_questions(limit: int = 3) -> List[Dict]:
    """誤答が多い設問TOP3を取得"""
    incorrect_count: Dict[str, int] = {}
    
    for user in _user_progress.values():
        for question_id, selected_index in user.answers.items():
            question = data.get_question_by_id(question_id)
            if selected_index != question.correct_index:
                incorrect_count[question_id] = incorrect_count.get(question_id, 0) + 1
    
    # 誤答数でソート
    sorted_questions = sorted(incorrect_count.items(), key=lambda x: x[1], reverse=True)
    
    result = []
    for question_id, count in sorted_questions[:limit]:
        question = data.get_question_by_id(question_id)
        result.append({
            "question_id": question_id,
            "title": question.title,
            "topic": question.topic,
            "incorrect_count": count
        })
    
    return result


# ==================== チャット履歴 ====================

def add_chat_message(name: str, message: str, is_user: bool = True, 
                     answer: Optional[str] = None, references: Optional[List] = None,
                     confidence: Optional[str] = None) -> ChatMessage:
    """チャットメッセージを追加"""
    if name not in _chat_history:
        _chat_history[name] = []
    
    chat_msg = ChatMessage(name, message, is_user)
    chat_msg.answer = answer
    chat_msg.references = references or []
    chat_msg.confidence = confidence
    
    _chat_history[name].append(chat_msg)
    return chat_msg


def get_chat_history(name: str) -> List[ChatMessage]:
    """チャット履歴を取得"""
    return _chat_history.get(name, [])


# ==================== エスカレーション ====================

def add_escalation(name: str, message: str, retrieved_articles: List[dict], confidence: str) -> Escalation:
    """エスカレーションを追加"""
    escalation = Escalation(name, message, retrieved_articles, confidence)
    _escalations.append(escalation)
    return escalation


def get_escalations() -> List[Escalation]:
    """エスカレーション一覧を取得"""
    return _escalations.copy()


def update_escalation_status(escalation_id: int, status: str) -> Optional[Escalation]:
    """エスカレーションのステータスを更新"""
    for esc in _escalations:
        if esc.id == escalation_id:
            if status in ["open", "in_progress", "closed"]:
                esc.status = status
                esc.updated_at = datetime.now()
                return esc
    return None

