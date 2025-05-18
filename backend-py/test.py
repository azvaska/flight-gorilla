import datetime
import pydevd
pydevd.settrace(log_file="/tmp/pydevd.log", stdoutToServer=True, stderrToServer=True, suspend=False)


print(datetime.datetime.now(datetime.UTC))