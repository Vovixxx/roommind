# Repository Coverage

[Full report](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

| Name                                                               |    Stmts |     Miss |   Cover |   Missing |
|------------------------------------------------------------------- | -------: | -------: | ------: | --------: |
| custom\_components/roommind/\_\_init\_\_.py                        |      116 |       79 |     32% |32-34, 40-61, 66-67, 73-111, 122, 135-136, 144-167, 172-210 |
| custom\_components/roommind/binary\_sensor.py                      |       37 |        0 |    100% |           |
| custom\_components/roommind/climate.py                             |      133 |        0 |    100% |           |
| custom\_components/roommind/config\_flow.py                        |       11 |       11 |      0% |      3-23 |
| custom\_components/roommind/const.py                               |      125 |        0 |    100% |           |
| custom\_components/roommind/control/\_\_init\_\_.py                |        0 |        0 |    100% |           |
| custom\_components/roommind/control/analytics\_simulator.py        |      207 |        2 |     99% |    53, 85 |
| custom\_components/roommind/control/mpc\_controller.py             |      934 |       54 |     94% |134, 137-138, 208-209, 215-216, 541-542, 576-579, 590-597, 610-611, 656, 963-965, 1187, 1273-1285, 1382-1383, 1398, 1681-1682, 1714-1715, 1752, 1759-1760, 1770-1771, 1775-1776, 1932, 1934, 1948, 1953, 1958 |
| custom\_components/roommind/control/mpc\_optimizer.py              |      211 |        0 |    100% |           |
| custom\_components/roommind/control/residual\_heat.py              |       24 |        0 |    100% |           |
| custom\_components/roommind/control/solar.py                       |       81 |        1 |     99% |        72 |
| custom\_components/roommind/control/thermal\_model.py              |      442 |       17 |     96% |394, 863-878, 989, 1112, 1119-1123 |
| custom\_components/roommind/coordinator.py                         |      967 |       71 |     93% |383-384, 687-690, 948-949, 959, 961, 1319, 1321-1323, 1396-1405, 1420, 1429, 1462-1464, 1478, 1536, 1816-1819, 1947-1949, 1953-1959, 1963, 1972, 1993, 1998, 2000, 2003, 2006, 2046, 2051-2056, 2060, 2093, 2095, 2098, 2101, 2117-2118, 2234, 2254-2262, 2280-2281, 2296-2301, 2318-2319 |
| custom\_components/roommind/diagnostics.py                         |      166 |        0 |    100% |           |
| custom\_components/roommind/managers/\_\_init\_\_.py               |        0 |        0 |    100% |           |
| custom\_components/roommind/managers/ac\_coil\_dry\_manager.py     |      246 |        0 |    100% |           |
| custom\_components/roommind/managers/compressor\_group\_manager.py |      157 |        2 |     99% |  121, 184 |
| custom\_components/roommind/managers/cover\_manager.py             |      197 |        0 |    100% |           |
| custom\_components/roommind/managers/cover\_orchestrator.py        |      165 |        2 |     99% |   73, 176 |
| custom\_components/roommind/managers/ekf\_training\_manager.py     |       54 |        1 |     98% |        28 |
| custom\_components/roommind/managers/heat\_source\_orchestrator.py |      156 |        9 |     94% |66, 74, 189, 217-220, 230, 266, 272 |
| custom\_components/roommind/managers/mold\_manager.py              |       69 |        0 |    100% |           |
| custom\_components/roommind/managers/residual\_heat\_tracker.py    |       38 |        0 |    100% |           |
| custom\_components/roommind/managers/valve\_manager.py             |      112 |        0 |    100% |           |
| custom\_components/roommind/managers/weather\_manager.py           |       59 |        0 |    100% |           |
| custom\_components/roommind/managers/window\_manager.py            |       37 |        0 |    100% |           |
| custom\_components/roommind/repairs.py                             |       15 |        0 |    100% |           |
| custom\_components/roommind/sensor.py                              |       54 |        0 |    100% |           |
| custom\_components/roommind/services/\_\_init\_\_.py               |        0 |        0 |    100% |           |
| custom\_components/roommind/services/analytics\_service.py         |      160 |        0 |    100% |           |
| custom\_components/roommind/store.py                               |      174 |        0 |    100% |           |
| custom\_components/roommind/switch.py                              |       93 |        0 |    100% |           |
| custom\_components/roommind/utils/\_\_init\_\_.py                  |        0 |        0 |    100% |           |
| custom\_components/roommind/utils/device\_utils.py                 |      168 |        0 |    100% |           |
| custom\_components/roommind/utils/history\_store.py                |      146 |        2 |     99% |     62-63 |
| custom\_components/roommind/utils/mold\_utils.py                   |       32 |        0 |    100% |           |
| custom\_components/roommind/utils/notification\_utils.py           |       50 |        0 |    100% |           |
| custom\_components/roommind/utils/presence\_utils.py               |       36 |        0 |    100% |           |
| custom\_components/roommind/utils/schedule\_utils.py               |      180 |        0 |    100% |           |
| custom\_components/roommind/utils/sensor\_utils.py                 |       29 |        1 |     97% |        25 |
| custom\_components/roommind/utils/temp\_utils.py                   |       26 |        0 |    100% |           |
| custom\_components/roommind/websocket\_api.py                      |      297 |        2 |     99% |   736-741 |
| **TOTAL**                                                          | **6204** |  **254** | **96%** |           |


## Setup coverage badge

Below are examples of the badges you can use in your main branch `README` file.

### Direct image

[![Coverage badge](https://raw.githubusercontent.com/Vovixxx/roommind/python-coverage-comment-action-data/badge.svg)](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

This is the one to use if your repository is private or if you don't want to customize anything.

### [Shields.io](https://shields.io) Json Endpoint

[![Coverage badge](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/Vovixxx/roommind/python-coverage-comment-action-data/endpoint.json)](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

Using this one will allow you to [customize](https://shields.io/endpoint) the look of your badge.
It won't work with private repositories. It won't be refreshed more than once per five minutes.

### [Shields.io](https://shields.io) Dynamic Badge

[![Coverage badge](https://img.shields.io/badge/dynamic/json?color=brightgreen&label=coverage&query=%24.message&url=https%3A%2F%2Fraw.githubusercontent.com%2FVovixxx%2Froommind%2Fpython-coverage-comment-action-data%2Fendpoint.json)](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

This one will always be the same color. It won't work for private repos. I'm not even sure why we included it.

## What is that?

This branch is part of the
[python-coverage-comment-action](https://github.com/marketplace/actions/python-coverage-comment)
GitHub Action. All the files in this branch are automatically generated and may be
overwritten at any moment.