"""
擬似RAG検索ロジック（キーワードマッチングベース）
"""
import json
import os
import re
from typing import List, Dict, Tuple
from pathlib import Path


def load_policies() -> List[Dict]:
    """規程データを読み込む"""
    json_path = Path(__file__).parent / "knowledge" / "policies.json"
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def simple_tokenize(text: str) -> List[str]:
    """
    簡易的なトークン化
    英数字・日本語混在を想定し、空白・記号で分割
    """
    # 英数字の連続、ひらがな/カタカナ/漢字の連続を抽出
    tokens = []
    # 英数字の連続
    tokens.extend(re.findall(r'[a-zA-Z0-9]+', text.lower()))
    # 日本語（ひらがな、カタカナ、漢字）の連続
    tokens.extend(re.findall(r'[ぁ-んァ-ヶー一-龠]+', text))
    return tokens


def calculate_score(query: str, policy: Dict) -> float:
    """
    クエリと規程の関連度スコアを計算
    - クエリ単語がtitle/bodyに含まれる回数
    - category一致ボーナス
    """
    query_tokens = simple_tokenize(query)
    if not query_tokens:
        return 0.0
    
    title_text = (policy.get("title", "") + " " + policy.get("body", "")).lower()
    body_text = policy.get("body", "").lower()
    
    score = 0.0
    matched_tokens = 0
    
    for token in query_tokens:
        token_lower = token.lower()
        # titleでのマッチ（重み2倍）
        title_count = title_text.count(token_lower)
        score += title_count * 2.0
        
        # bodyでのマッチ
        body_count = body_text.count(token_lower)
        score += body_count * 1.0
        
        if title_count > 0 or body_count > 0:
            matched_tokens += 1
    
    # マッチしたトークン数の割合
    match_ratio = matched_tokens / len(query_tokens) if query_tokens else 0.0
    score *= (1.0 + match_ratio * 0.5)  # マッチ率ボーナス
    
    return score


def search_policies(query: str, top_k: int = 3) -> List[Dict]:
    """
    規程データから関連条文を検索（上位top_k件）
    """
    policies = load_policies()
    
    # 各規程のスコアを計算
    scored_policies = []
    for policy in policies:
        score = calculate_score(query, policy)
        if score > 0:
            scored_policies.append((score, policy))
    
    # スコアでソート（降順）
    scored_policies.sort(key=lambda x: x[0], reverse=True)
    
    # 上位top_k件を返す
    result = []
    for score, policy in scored_policies[:top_k]:
        result.append({
            "id": policy["id"],
            "category": policy["category"],
            "title": policy["title"],
            "snippet": policy["body"][:120] + "..." if len(policy["body"]) > 120 else policy["body"],
            "url": policy["url"],
            "score": score
        })
    
    return result


def calculate_confidence(top_results: List[Dict]) -> str:
    """
    自信度を計算（High/Medium/Low）
    - top1とtop2のスコア差
    - ヒット単語数
    """
    if not top_results:
        return "Low"
    
    if len(top_results) == 1:
        # 1件しかヒットしない場合はLow
        return "Low"
    
    top1_score = top_results[0].get("score", 0)
    top2_score = top_results[1].get("score", 0) if len(top_results) > 1 else 0
    
    score_diff = top1_score - top2_score
    score_ratio = score_diff / top1_score if top1_score > 0 else 0
    
    # スコアが高い & 差が大きい → High
    if top1_score > 10 and score_ratio > 0.3:
        return "High"
    # スコアが中程度 → Medium
    elif top1_score > 5:
        return "Medium"
    # それ以外 → Low
    else:
        return "Low"


def generate_summary(query: str, top_results: List[Dict]) -> str:
    """
    規程抜粋を根拠に要約回答を生成（200-350文字程度）
    """
    if not top_results:
        return "申し訳ございませんが、該当する規程が見つかりませんでした。人事部門または所管部門へ直接ご相談ください。"
    
    # 主要な規程の内容を要約
    main_policy = top_results[0]
    category = main_policy.get("category", "")
    
    category_names = {
        "governance": "ガバナンス",
        "harassment": "ハラスメント",
        "infosec": "情報セキュリティ"
    }
    category_name = category_names.get(category, "社内規程")
    
    # テンプレートベースの要約生成
    summary_parts = []
    
    # カテゴリに応じた基本回答
    if category == "governance":
        summary_parts.append(f"【{category_name}に関するご質問】")
        summary_parts.append("社内規程によると、取引先との関係や契約に関する判断は、事前承認と記録が重要です。")
        summary_parts.append("利益相反の可能性がある場合は速やかに申告し、例外条件の契約は正規の承認フローに従ってください。")
    elif category == "harassment":
        summary_parts.append(f"【{category_name}に関するご質問】")
        summary_parts.append("ハラスメントは、相手の尊厳を傷つけ就業環境を悪化させる言動です。")
        summary_parts.append("公の場での人格否定、私生活への詮索、報復行為は禁止されています。")
        summary_parts.append("相談窓口への連絡や、安全確保を優先してください。")
    elif category == "infosec":
        summary_parts.append(f"【{category_name}に関するご質問】")
        summary_parts.append("情報の取り扱いについては、個人メールや個人クラウドへの転送は原則禁止です。")
        summary_parts.append("共有は必要最小限にし、承認された手段を使用してください。")
        summary_parts.append("フリーWi-Fi利用時はVPN等の安全な手段を利用し、インシデント時は速やかに報告してください。")
    else:
        summary_parts.append("【社内規程に関するご質問】")
        summary_parts.append("該当する規程がございます。詳細は参照条文をご確認ください。")
    
    # 主要な規程の要点を追加
    if len(top_results) > 0:
        main_body = load_policies()
        main_policy_full = next((p for p in main_body if p["id"] == main_policy["id"]), None)
        if main_policy_full:
            body = main_policy_full.get("body", "")
            # 最初の2文程度を抽出
            sentences = re.split(r'[。！？]', body)
            if sentences:
                key_sentences = sentences[:2]
                summary_parts.append(" ".join(key_sentences[:2]) + "。")
    
    summary = " ".join(summary_parts)
    
    # 文字数調整（200-350文字）
    if len(summary) > 350:
        summary = summary[:347] + "..."
    elif len(summary) < 200 and len(top_results) > 0:
        # 追加情報を補足
        summary += " 詳細は参照条文をご確認いただき、判断に迷う場合は人事部門へご相談ください。"
    
    return summary

