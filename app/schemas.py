from typing import List, Optional
from pydantic import BaseModel


class Question(BaseModel):
    id: str
    topic: str
    title: str
    choices: List[str]
    correct_index: int
    explanation: str
    evidence_url: str


class AnswerRequest(BaseModel):
    name: str
    question_id: str
    selected_index: int


class RemindRequest(BaseModel):
    selected_names: List[str]
    message: Optional[str] = None


class QAMessage(BaseModel):
    name: str
    message: str


class EscalationRequest(BaseModel):
    name: str
    message: str
    retrieved_articles: List[dict]
    confidence: str

