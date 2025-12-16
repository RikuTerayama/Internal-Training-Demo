"""
設問データのシード定義
"""
from typing import List
from app.schemas import Question

QUESTIONS: List[Question] = [
    # -------------------------
    # Governance (ガバナンス)
    # -------------------------
    Question(
        id="gov-001",
        topic="governance",
        title="取引先から『今度の会食はうちが払います。高級店でどうですか？』と提案されました。あなたの最初の対応として最も適切なのはどれ？",
        choices=[
            "ありがたく受け、あとで上司に口頭で共有する",
            "社内の接待・贈答ルールを確認し、必要なら事前承認を取る（または条件を調整する）",
            "自分の判断で断るが、記録は残さない",
            "同僚も誘えば問題ないので受ける"
        ],
        correct_index=1,
        explanation="接待・贈答は利益相反や贈収賄リスクにつながるため、社内ルールの確認と事前承認（または条件調整）が基本です。記録・透明性が重要です。",
        evidence_url="https://example.com/policy/governance/entertainment"
    ),
    Question(
        id="gov-002",
        topic="governance",
        title="あなたの親族が経営する会社が、あなたの担当領域のベンダー候補に入っています。どうするのが最も適切？",
        choices=[
            "品質が良いので黙って選定を進める",
            "関係があることを上長/調達に申告し、選定プロセスから外れる（または第三者に判断を委ねる）",
            "価格が安いなら問題ないので進める",
            "契約が決まってから申告する"
        ],
        correct_index=1,
        explanation="利益相反の可能性がある場合は、早い段階で申告し、プロセスの公正性を担保する必要があります（関与を避ける/第三者判断）。",
        evidence_url="https://example.com/policy/governance/conflict-of-interest"
    ),
    Question(
        id="gov-003",
        topic="governance",
        title="上長が不在のため、あなたが『例外的な条件での契約締結』を急いで進めたい状況です。最も適切なのは？",
        choices=[
            "緊急なので承認なしで進める",
            "メールやチャットで後追い承認をもらえば良いので先に進める",
            "社内の承認フロー（代理承認/承認権限）を確認し、正規の手続きで進める",
            "取引先に『あとで修正する』と伝えて締結する"
        ],
        correct_index=2,
        explanation="例外条件の契約はリスクが高いので、承認権限・代理承認など正規フローに従うのが原則です。スピードより統制が優先されます。",
        evidence_url="https://example.com/policy/governance/approval-matrix"
    ),

    # -------------------------
    # Harassment (ハラスメント)
    # -------------------------
    Question(
        id="har-001",
        topic="harassment",
        title="上司が部下に対し、みんなの前で『使えない』『だからダメなんだ』と強い口調で叱責しています。あなたが同席者として取るべき最初の行動は？",
        choices=[
            "見て見ぬふりをする（関わらない）",
            "その場で笑って場を和ませる",
            "状況を止める/場を切り上げるなど安全確保をし、必要に応じて人事・相談窓口に共有する",
            "部下に『我慢して』と後で伝える"
        ],
        correct_index=2,
        explanation="公の場での人格否定・威圧はハラスメントに該当し得ます。まずは当事者の安全確保（場の切り替え）と、適切な窓口への共有が重要です。",
        evidence_url="https://example.com/policy/harassment/reporting"
    ),
    Question(
        id="har-002",
        topic="harassment",
        title="飲み会で同僚に『彼氏/彼女いるの？結婚は？』と何度も私生活をしつこく聞く人がいます。最も適切なのは？",
        choices=[
            "冗談なので問題ない",
            "本人が嫌がっていそうなら話題を変える/やめるよう促す（必要なら相談窓口へ）",
            "場を盛り上げるために自分も質問する",
            "答えたくないなら席を外せば良い"
        ],
        correct_index=1,
        explanation="私生活への執拗な詮索は相手に不快感や圧力を与え、ハラスメントに該当し得ます。まずは行動を止める方向で介入するのが望ましいです。",
        evidence_url="https://example.com/policy/harassment/behavior"
    ),
    Question(
        id="har-003",
        topic="harassment",
        title="同僚が相談窓口に連絡したことを理由に、周囲が『あの人は面倒』と陰口を言い、業務連携を減らしています。最も適切なのは？",
        choices=[
            "本人が気にしなければ問題ない",
            "相談した人が悪いので仕方ない",
            "報復・不利益取扱いの可能性があるため、状況を記録し、管理職/人事へ共有する",
            "陰口を言う人の仲間に入らないだけで十分"
        ],
        correct_index=2,
        explanation="相談・通報を理由とした不利益取扱いは重大リスクです（報復）。個人攻撃を止め、組織として是正する必要があります。",
        evidence_url="https://example.com/policy/harassment/retaliation"
    ),

    # -------------------------
    # InfoSec (情報漏洩)
    # -------------------------
    Question(
        id="sec-001",
        topic="infosec",
        title="急ぎで資料を確認したくて、社用ファイルを自分の個人メール（Gmail等）に転送しようとしています。最も適切なのは？",
        choices=[
            "急ぎなら仕方ないので転送する",
            "パスワード付きZIPにすれば個人メールでもOK",
            "会社の承認された共有手段（社内Drive/SharePoint等）を使い、個人メール転送は避ける",
            "自分だけが見るので問題ない"
        ],
        correct_index=2,
        explanation="個人メールへの転送は情報管理上の重大リスクです。承認された共有基盤・アクセス制御のある手段を使うのが原則です。",
        evidence_url="https://example.com/policy/infosec/data-handling"
    ),
    Question(
        id="sec-002",
        topic="infosec",
        title="社外で作業中、フリーWi-Fiに接続して社内システムへログインしようとしています。最も適切なのは？",
        choices=[
            "フリーWi-Fiでもパスワードがあれば安全",
            "VPNなど会社の定める安全手段を使う/テザリング等に切り替える",
            "ログインだけなら短時間なので問題ない",
            "二要素認証があるから安全"
        ],
        correct_index=1,
        explanation="フリーWi-Fiは盗聴・なりすましリスクがあります。社内ルールに従いVPNや安全な回線（テザリング等）に切り替えるのが基本です。",
        evidence_url="https://example.com/policy/infosec/network"
    ),
    Question(
        id="sec-003",
        topic="infosec",
        title="社内チャットに、顧客情報が写り込んだ画面のスクリーンショットを貼ろうとしています。最も適切なのは？",
        choices=[
            "社内チャットだから問題ない",
            "見えにくいので拡大して貼る",
            "共有最小化（マスキング/必要情報のみ）を徹底し、顧客情報が含まれるなら貼らず別の安全な手段で共有する",
            "一度貼ってから消せば問題ない"
        ],
        correct_index=2,
        explanation="社内でも共有範囲は最小化が原則です。顧客情報が含まれる画像共有は漏洩リスクが高いため、マスキングまたは別手段を選びます。",
        evidence_url="https://example.com/policy/infosec/minimization"
    ),
]


def get_questions_by_topic(topic: str) -> List[Question]:
    """指定されたトピックの設問を取得"""
    return [q for q in QUESTIONS if q.topic == topic]


def get_question_by_id(question_id: str) -> Question:
    """IDで設問を取得"""
    for q in QUESTIONS:
        if q.id == question_id:
            return q
    raise ValueError(f"Question not found: {question_id}")

