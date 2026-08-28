import json
import hashlib
from typing import Dict, Any

class VaultCommitEngine:
    def compute_experiment_hash(self, hypothesis: str, strategy_template_id: str, params: Dict[str, Any]) -> str:
        canonical_str = json.dumps({
            "hypothesis": hypothesis,
            "strategy_template_id": strategy_template_id,
            "parameters": params
        }, sort_keys=True)
        
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

vault_commit_engine = VaultCommitEngine()
