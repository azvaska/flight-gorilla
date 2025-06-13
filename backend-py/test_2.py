import pydevd


pydevd.settrace(
    host='127.0.0.1',
    port=5678,
    stdoutToServer=True,   # forward your print()/stderr to the IDE console
    stderrToServer=True,
    suspend=True          # don’t pause immediately—only pause on breakpoints
)


print("Debugger is now attached as a client.")
