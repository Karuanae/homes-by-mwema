"""add consultations table and link chats

Revision ID: add_consultations
Revises: 866e30a1aee7
Create Date: 2026-02-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_consultations'
down_revision = '866e30a1aee7'
branch_labels = None
depends_on = None


def upgrade():
    # create consultations table
    op.create_table(
        'consultations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('hour', sa.Integer(), nullable=True),
        sa.Column('minute', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # add consultation_id to chats
    op.add_column('chats', sa.Column('consultation_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_chats_consultation', 'chats', 'consultations', ['consultation_id'], ['id']
    )


def downgrade():
    op.drop_constraint('fk_chats_consultation', 'chats', type_='foreignkey')
    op.drop_column('chats', 'consultation_id')
    op.drop_table('consultations')
