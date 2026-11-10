#!/usr/bin/env python3
"""Crée une issue GitHub par élément du backlog, avec ses étiquettes.

Prérequis : GitHub CLI installé et connecté (`gh auth login`), dépôt déjà créé.
Usage :
    python3 backlog/import-issues.py PROPRIETAIRE/radon-laveur [NUMERO_DU_PROJET]
Le numéro du projet (GitHub Projects) est dans son URL : .../projects/3 -> 3.
S'il est donné, chaque issue est aussi ajoutée au tableau du projet.
"""
import csv
import subprocess
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit(__doc__)
repo = sys.argv[1]
project = sys.argv[2] if len(sys.argv) > 2 else None
owner = repo.split("/")[0]

labels = {
    "Must": "B60205", "Should": "FBCA04", "Could": "0E8A16",
    "sprint-1": "1D76DB", "sprint-2": "1D76DB", "sprint-3": "1D76DB", "sprint-4": "1D76DB",
}
for p in (1, 2, 3, 5, 8):
    labels[f"{p} pts"] = "C5DEF5"


def gh(*args):
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout.strip()


for name, color in labels.items():
    subprocess.run(["gh", "label", "create", name, "--repo", repo, "--color", color, "--force"],
                   capture_output=True, text=True)

rows = csv.DictReader(open(Path(__file__).with_name("backlog.csv"), encoding="utf-8"))
for r in rows:
    tags = [r["moscow"], f"{r['points']} pts"] + ([f"sprint-{r['sprint']}"] if r["sprint"] else [])
    body = f"{r['histoire']}\n\n- Rang : {r['rang']}\n- Estimation : {r['points']} points\n- MoSCoW : {r['moscow']}\n\n**Critères d'acceptation** : à compléter par le PO."
    url = gh("issue", "create", "--repo", repo, "--title", f"{r['id']} {r['titre']}",
             "--body", body, *sum((["--label", t] for t in tags), []))
    print("créée :", url)
    if project:
        gh("project", "item-add", project, "--owner", owner, "--url", url)
