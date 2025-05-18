import pydevd

# This tells pydevd “connect out” to the debug server at 127.0.0.1:5678
pydevd.settrace(
    host='127.0.0.1',
    port=5678,
    stdoutToServer=True,   # forward your print()/stderr to the IDE console
    stderrToServer=True,
    suspend=True          # don’t pause immediately—only pause on breakpoints
)

# …rest of your app…
print("Debugger is now attached as a client.")