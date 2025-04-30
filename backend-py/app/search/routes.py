from app.search import bp

@bp.route('/')
def index():
    return "a"