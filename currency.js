var CurrencyWidget = function (options) {
    let widget;
    let currenciesContent;
    let api_url = "https://www.cbr-xml-daily.ru/daily_json.js";
    let cacheKey = "currencies";

    options = options || {};
    options.title = options.title || "Курсы валют";
    options.integerElement = options.integerElement || document.body;
    options.currencies = options.currencies || ["USD", "EUR", "UAH", "KZT"];
    options.loaderText = options.loaderText || "Загрузка актуальных курсов...";
    options.updateInterval = options.updateInterval || 20000;
    options.errorText = options.errorText || "Информация о валютах отсутствует";

    function init() {
        widget = document.createElement("div");
        widget.className = "currency-widget";
        options.integerElement.appendChild(widget);

        let header = document.createElement("div");
        header.className = "currency-widget__header";

        let updateButton = document.createElement("button");
        updateButton.className = "currency-widget-button";
        updateButton.innerHTML =
            '<svg height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M35.3 12.7c-2.89-2.9-6.88-4.7-11.3-4.7-8.84 0-15.98 7.16-15.98 16s7.14 16 15.98 16c7.45 0 13.69-5.1 15.46-12h-4.16c-1.65 4.66-6.07 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.31 0 6.28 1.38 8.45 3.55l-6.45 6.45h14v-14l-4.7 4.7z"' +
            'fill="white" />' +
            '<path d="M0 0h48v48h-48z" fill="none" />' +
            "</svg>";
        updateButton.onclick = function () {
            updateCurrencies(true);
        };

        let title = document.createElement("h1");
        title.innerText = options.title;

        header.appendChild(title);
        header.appendChild(updateButton);
        widget.appendChild(header);

        currenciesContent = document.createElement("div");
        currenciesContent.className = "currency-widget__inner";
        widget.appendChild(currenciesContent);

        updateCurrencies();
        setInterval(updateCurrencies, options.updateInterval, true);
    }

    function addLoader() {
        let loader = document.createElement("div");
        loader.className = "loader-wrapper";
        loader.id = "currency-loader";

        let loaderContent = document.createElement("div");
        loaderContent.className = "loader-content";

        let loaderText = document.createElement("p");
        loaderText.className = "loader-text";
        loaderText.innerText = options.loaderText;

        let loaderSpinner = document.createElement("div");
        loaderSpinner.className = "loader-spinner";

        loaderContent.appendChild(loaderText);
        loaderContent.appendChild(loaderSpinner);
        loader.appendChild(loaderContent);
        widget.appendChild(loader);
    }

    function removeLoader() {
        let loader = document.getElementById("currency-loader");
        widget.removeChild(loader);
    }

    function getCurrencies(successCallback, errorCallback) {
        let xhr = new XMLHttpRequest();
        try {
            xhr.open("GET", api_url, true);
            xhr.send();

            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;

                try {
                    let currencies = [];

                    let json = JSON.parse(xhr.responseText);
                    let currenciesResponse = json.Valute;
                    options.currencies.forEach(function (currencyKey) {
                        let currencyInfo = currenciesResponse[currencyKey];
                        if (currencyInfo) {
                            let currentValue =
                                currencyInfo.Value / currencyInfo.Nominal;
                            let prevValue =
                                currencyInfo.Previous / currencyInfo.Nominal;

                            currencies.push({
                                value: currentValue,
                                name: currencyKey,
                                prev: prevValue,
                                percent: (currentValue / prevValue - 1) * 100,
                            });
                        }
                    });

                    successCallback(currencies);
                } catch (e) {
                    errorCallback(e);
                }
            };
        } catch (e) {
            errorCallback(e);
        }
    }

    function updateCurrencies(overrideCache) {
        if (localStorage.hasOwnProperty(cacheKey) && !overrideCache) {
            console.log("update: from cache");

            render(JSON.parse(localStorage.getItem(cacheKey)));
            return;
        }
        console.log("update: global");

        addLoader();
        function renderCurrencies(neededCurrencies) {
            removeLoader();
            localStorage.setItem(cacheKey, JSON.stringify(neededCurrencies));
            render(neededCurrencies);
        }

        getCurrencies(
            function (currencies) {
                console.log("update: successfull");
                renderCurrencies(currencies);
            },
            function (e) {
                console.log("update: fail; error: ", e);
                renderCurrencies([]);
            }
        );
    }

    function render(currencies) {
        // Очищаем прошлые элементы, если они есть
        if (currenciesContent.hasChildNodes()) {
            currenciesContent.innerHTML = "";
        }

        if (!currencies || currencies.length < 1) {
            let currencyEmpty = document.createElement("p");
            currencyEmpty.innerText = options.errorText;
            currenciesContent.appendChild(currencyEmpty);
            return;
        }

        currencies.forEach(function (currency) {
            let currencyElement = document.createElement("div");
            currencyElement.className = "currency-element";

            let nameElement = document.createElement("p");
            nameElement.className = "currency-name";
            nameElement.innerText = currency.name;

            let valueElement = document.createElement("p");
            let curValue = document.createElement("span");
            curValue.innerText = currency.value.toFixed(4);

            let prevValue = document.createElement("span");
            prevValue.className = "previous-value";
            prevValue.innerText = " / " + currency.prev.toFixed(4);

            valueElement.appendChild(curValue);
            valueElement.appendChild(prevValue);

            let percentElement = document.createElement("p");
            percentElement.innerText = currency.percent.toFixed(4) + "%";

            if (currency.percent > 0) {
                percentElement.className = "rise";
                percentElement.innerText = "+" + percentElement.innerText;
            } else {
                percentElement.className = "fall";
            }

            currencyElement.appendChild(nameElement);
            currencyElement.appendChild(valueElement);
            currencyElement.appendChild(percentElement);
            currenciesContent.appendChild(currencyElement);
        });
    }

    return init();
};
