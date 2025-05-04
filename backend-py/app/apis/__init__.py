from flask_restx import Api

from .login import api as userNSA


api = Api(
    title='My Title',
    version='1.0',
    description='A description',
    # All API metadatas
)

api.add_namespace(userNSA)