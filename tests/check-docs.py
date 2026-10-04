from pathlib import Path
import re
import subprocess
import yaml
root = Path(__file__).resolve().parents[1]
text = (root / 'SKILL.md').read_text()
front = yaml.safe_load(text.split('---', 2)[1])
assert front['name'] == root.name or front['name'] == 'wechat-mini-game-delivery'
assert isinstance(front['description'], str) and front['description'].strip()
assert len(front['name']) < 64 and re.fullmatch(r'[a-z0-9-]+', front['name'])
workflow = yaml.load((root / '.github/workflows/quality.yml').read_text(), Loader=yaml.BaseLoader)
assert 'push' in workflow['on'] and 'pull_request' in workflow['on']
assert workflow['permissions']['contents'] == 'read'
ui = yaml.safe_load((root / 'agents/openai.yaml').read_text())
assert ui['interface']['display_name']
for file in root.rglob('*.md'):
    if '.git' in file.parts:
        continue
    for link in re.findall(r'\]\(([^)]+)\)', file.read_text()):
        if '://' not in link and not link.startswith('#'):
            assert (file.parent / link.split('#', 1)[0]).exists(), f'{file}: broken link {link}'
for file in list((root / 'scripts').glob('*.js')) + list((root / 'examples/book-quiz').glob('*.js')):
    subprocess.run(['node', '--check', str(file)], check=True)
print('Skill frontmatter, metadata, document links and JavaScript syntax passed')
