import re
import sys

# Script: update_contract_addr.py
# Usage: python update_contract_addr.py <contract_env_var> <real_contract_addr>
# Example: python update_contract_addr.py EDUADMISSION_CONTRACT_ADDR cosmos1abcd1234...

def update_docker_compose(contract_env_var, real_addr, path='deploy/docker-compose.yml'):
    pat = re.compile(rf'(\s*- {contract_env_var}=)([^\s#]+)')
    changed = False
    lines = []
    with open(path) as f:
        for line in f:
            if pat.search(line):
                newline = pat.sub(rf'\1{real_addr}', line)
                if newline != line:
                    changed = True
                    line = newline
            lines.append(line)
    if changed:
        with open(path, 'w') as f:
            f.writelines(lines)
        print(f"Updated {contract_env_var} to {real_addr} in {path}")
    else:
        print(f"No changes made. {contract_env_var} already set.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update_contract_addr.py <contract_env_var> <real_contract_addr>")
        sys.exit(1)
    update_docker_compose(sys.argv[1], sys.argv[2])
