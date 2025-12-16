#!/usr/bin/env python3
"""questions.jsonをapp/static/にコピーするスクリプト"""
import shutil
import os

src = 'questions.json'
dst = 'app/static/questions.json'

if os.path.exists(src):
    shutil.copy(src, dst)
    print(f'Copied {src} to {dst}')
else:
    print(f'Error: {src} not found')

