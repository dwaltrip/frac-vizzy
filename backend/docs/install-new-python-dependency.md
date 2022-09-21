#### pip-tools

Make sure you have `pip-tools` installed in your virtual environment.

https://github.com/jazzband/pip-tools

If not, you can install it like so:

```bash
source venv/bin/activate # if not already activated
pip install pip-tools
```

#### Install new dependency

First, edit `requirements.in` to specify the new dependency. You can optionally specify a constrain on the version, or just take the latest.

Then, use pip-tools to update `requirements.txt` with the pinned versions:

```bash
source venv/bin/activate # if not already activated
pip-compile requirements.in
```

Now, install the dependency:

```bash
source venv/bin/activate # if not already activated
pip install -r requirements.txt
```
