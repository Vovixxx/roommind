# Repository Coverage

[Full report](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

| Name                                                               |    Stmts |     Miss |   Cover |   Missing |
|------------------------------------------------------------------- | -------: | -------: | ------: | --------: |
| custom\_components/roommind/\_\_init\_\_.py                        |      125 |       81 |     35% |35-37, 43-66, 71-72, 78-116, 127, 141-142, 159-182, 187-225 |
| custom\_components/roommind/binary\_sensor.py                      |       43 |        1 |     98% |        61 |
| custom\_components/roommind/climate.py                             |      443 |       13 |     97% |90, 97, 100, 120-122, 126, 130, 134-136, 247, 437 |
| custom\_components/roommind/config\_flow.py                        |       11 |       11 |      0% |      3-23 |
| custom\_components/roommind/const.py                               |      158 |        0 |    100% |           |
| custom\_components/roommind/control/\_\_init\_\_.py                |        0 |        0 |    100% |           |
| custom\_components/roommind/control/analytics\_simulator.py        |      230 |        2 |     99% |   77, 109 |
| custom\_components/roommind/control/direct\_valve.py               |      109 |        0 |    100% |           |
| custom\_components/roommind/control/mpc\_controller.py             |     1408 |       44 |     97% |187, 205, 208-209, 276, 322-323, 395-396, 402-403, 415-425, 763-764, 828-835, 1049, 1543-1544, 1967, 1970, 2091-2100, 2115, 2489, 2496, 2720, 2727-2728, 2738-2739, 2743-2744, 3021, 3023, 3034, 3036, 3041, 3046, 3068, 3070 |
| custom\_components/roommind/control/mpc\_optimizer.py              |      301 |        0 |    100% |           |
| custom\_components/roommind/control/residual\_heat.py              |       34 |        0 |    100% |           |
| custom\_components/roommind/control/solar.py                       |       81 |        1 |     99% |        72 |
| custom\_components/roommind/control/thermal\_model.py              |      475 |       17 |     96% |434, 938-946, 1064, 1189, 1196-1200 |
| custom\_components/roommind/coordinator.py                         |     1180 |       75 |     94% |436-437, 798-799, 815-818, 1121-1122, 1132, 1134, 1550, 1552-1554, 1655-1664, 1686, 1695, 1738-1740, 1754, 1782-1783, 1834, 2170-2173, 2351-2353, 2357-2363, 2367, 2376, 2397, 2402, 2404, 2407, 2410, 2451, 2456-2461, 2465, 2498, 2500, 2503, 2506, 2522-2523, 2639, 2659-2667, 2685-2686, 2701-2706, 2723-2724 |
| custom\_components/roommind/deprecation.py                         |       56 |        0 |    100% |           |
| custom\_components/roommind/diagnostics.py                         |      231 |        0 |    100% |           |
| custom\_components/roommind/entity.py                              |       22 |       12 |     45% |17-20, 25, 35-41 |
| custom\_components/roommind/managers/\_\_init\_\_.py               |        0 |        0 |    100% |           |
| custom\_components/roommind/managers/ac\_coil\_dry\_manager.py     |      248 |        0 |    100% |           |
| custom\_components/roommind/managers/compressor\_group\_manager.py |      186 |        2 |     99% |  125, 223 |
| custom\_components/roommind/managers/cover\_manager.py             |      204 |        0 |    100% |           |
| custom\_components/roommind/managers/cover\_orchestrator.py        |      243 |        2 |     99% |   85, 197 |
| custom\_components/roommind/managers/ekf\_training\_manager.py     |       58 |        1 |     98% |        31 |
| custom\_components/roommind/managers/head\_offset\_tracker.py      |       67 |        2 |     97% |    97, 99 |
| custom\_components/roommind/managers/heat\_source\_orchestrator.py |      157 |        7 |     96% |79, 198, 230-233, 243, 278 |
| custom\_components/roommind/managers/mold\_manager.py              |       69 |        0 |    100% |           |
| custom\_components/roommind/managers/residual\_heat\_tracker.py    |       69 |        0 |    100% |           |
| custom\_components/roommind/managers/valve\_manager.py             |      112 |        0 |    100% |           |
| custom\_components/roommind/managers/weather\_manager.py           |       59 |        0 |    100% |           |
| custom\_components/roommind/managers/window\_manager.py            |       93 |        0 |    100% |           |
| custom\_components/roommind/repairs.py                             |       15 |        0 |    100% |           |
| custom\_components/roommind/sensor.py                              |       75 |        8 |     89% |73, 78-82, 97, 107 |
| custom\_components/roommind/services/\_\_init\_\_.py               |        0 |        0 |    100% |           |
| custom\_components/roommind/services/analytics\_service.py         |      170 |        0 |    100% |           |
| custom\_components/roommind/store.py                               |      184 |        0 |    100% |           |
| custom\_components/roommind/switch.py                              |      110 |        3 |     97% |70, 107, 143 |
| custom\_components/roommind/utils/\_\_init\_\_.py                  |        0 |        0 |    100% |           |
| custom\_components/roommind/utils/device\_utils.py                 |      224 |        2 |     99% |  265, 269 |
| custom\_components/roommind/utils/history\_store.py                |      146 |        2 |     99% |     62-63 |
| custom\_components/roommind/utils/mold\_utils.py                   |       32 |        0 |    100% |           |
| custom\_components/roommind/utils/notification\_utils.py           |       50 |        0 |    100% |           |
| custom\_components/roommind/utils/presence\_utils.py               |       36 |        0 |    100% |           |
| custom\_components/roommind/utils/schedule\_utils.py               |      204 |        0 |    100% |           |
| custom\_components/roommind/utils/sensor\_utils.py                 |       29 |        1 |     97% |        25 |
| custom\_components/roommind/utils/temp\_utils.py                   |       26 |        0 |    100% |           |
| custom\_components/roommind/websocket\_api.py                      |      319 |        2 |     99% |   794-799 |
| **TOTAL**                                                          | **8092** |  **289** | **96%** |           |


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