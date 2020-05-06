@echo off

set PATH=C:\Python38\Scripts\;C:\Python38\;%PATH%
set TESTAPP_SNAPSHOT_FILEPATH=O:\DevArea\BridgeIFC\out_2

REM #  Dev:103, QA:102, Prod: 0, Perf:294
REM # [OPTIONAL] If not provided default to 0 or PROD
REM imjs_buddi_resolve_url_using_region="102"

cd /d %~dp0

REM leave running
cmd /K