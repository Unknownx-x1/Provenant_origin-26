import os
import glob

def test_research_sleeve_capital_firewall():
    """
    Architectural Firewall Enforcement Test:
    Ensures no file inside research_sleeve/ imports or calls execution or allocation functions.
    """
    research_dir = os.path.join(os.path.dirname(__file__), "..", "app", "research_sleeve")
    py_files = glob.glob(os.path.join(research_dir, "*.py"))
    
    forbidden_terms = ["execute_order", "allocate_capital", "execution.simulator", "risk.allocator"]
    
    for filepath in py_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            for term in forbidden_terms:
                assert term not in content, f"FIREWALL VIOLATION: Forbidden term '{term}' found in {filepath}"
