# Repository Coverage

[Full report](https://htmlpreview.github.io/?https://github.com/Vovixxx/roommind/blob/python-coverage-comment-action-data/htmlcov/index.html)

| Name                                                               |    Stmts |     Miss |   Cover |   Missing |
|------------------------------------------------------------------- | -------: | -------: | ------: | --------: |
| custom\_components/roommind/\_\_init\_\_.py                        |      125 |       81 |     35% |35-37, 43-66, 71-72, 78-116, 127, 141-142, 159-182, 187-225 |
| custom\_components/roommind/binary\_sensor.py                      |       43 |        1 |     98% |        61 |
| custom\_components/roommind/climate.py                             |      445 |       15 |     97% |90, 97, 100, 120-122, 126-127, 131-132, 136-138, 249, 439 |
| custom\_components/roommind/config\_flow.py                        |       11 |       11 |      0% |      3-23 |
| custom\_components/roommind/const.py                               |      158 |        0 |    100% |           |
| custom\_components/roommind/control/\_\_init\_\_.py                |        0 |        0 |    100% |           |
| custom\_components/roommind/control/analytics\_simulator.py        |      230 |        2 |     99% |   77, 109 |
| custom\_components/roommind/control/direct\_valve.py               |      109 |        0 |    100% |           |
| custom\_components/roommind/control/mpc\_controller.py             |     1435 |       45 |     97% |189, 207, 210-211, 278, 324-325, 397-398, 404-405, 417-427, 765-766, 830-837, 1052, 1547-1548, 1971, 1974, 1996, 2134-2143, 2158, 2533, 2540, 2765, 2772-2773, 2783-2784, 2788-2789, 3067, 3069, 3080, 3082, 3087, 3092, 3114, 3116 |
| custom\_components/roommind/control/mpc\_optimizer.py              |      301 |        0 |    100% |           |
| custom\_components/roommind/control/residual\_heat.py              |       34 |        0 |    100% |           |
| custom\_components/roommind/control/solar.py                       |       81 |        1 |     99% |        72 |
| custom\_components/roommind/control/thermal\_model.py              |      475 |       17 |     96% |434, 938-946, 1064, 1189, 1196-1200 |
| custom\_components/roommind/coordinator.py                         |     1180 |       75 |     94% |437-438, 799-800, 816-819, 1122-1123, 1133, 1135, 1551, 1553-1555, 1658-1667, 1689, 1698, 1747-1749, 1764, 1792-1793, 1844, 2180-2183, 2361-2363, 2367-2373, 2377, 2386, 2407, 2412, 2414, 2417, 2420, 2461, 2466-2471, 2475, 2508, 2510, 2513, 2516, 2532-2533, 2649, 2669-2677, 2695-2696, 2711-2716, 2733-2734 |
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
| custom\_components/roommind/utils/device\_utils.py                 |      242 |        3 |     99% |166, 279, 283 |
| custom\_components/roommind/utils/history\_store.py                |      146 |        2 |     99% |     62-63 |
| custom\_components/roommind/utils/mold\_utils.py                   |       32 |        0 |    100% |           |
| custom\_components/roommind/utils/notification\_utils.py           |       50 |        0 |    100% |           |
| custom\_components/roommind/utils/presence\_utils.py               |       36 |        0 |    100% |           |
| custom\_components/roommind/utils/schedule\_utils.py               |      204 |        0 |    100% |           |
| custom\_components/roommind/utils/sensor\_utils.py                 |       29 |        1 |     97% |        25 |
| custom\_components/roommind/utils/temp\_utils.py                   |       26 |        0 |    100% |           |
| custom\_components/roommind/websocket\_api.py                      |      319 |        2 |     99% |   794-799 |
| **TOTAL**                                                          | **8139** |  **293** | **96%** |           |


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