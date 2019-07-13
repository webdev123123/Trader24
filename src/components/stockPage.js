import React from "react";
import {logout} from "./auth";
import firebase from "firebase/app";
import {Line} from "react-chartjs-2";
import {defaults} from "react-chartjs-2";
import $ from "jquery";
import "chartjs-plugin-annotation";

defaults.global.defaultFontStyle = "Bold";
defaults.global.defaultFontFamily = "Quicksand";
defaults.global.animation.duration = 200;

const db = firebase.firestore();
var options = {
  layout: {
    padding: {
      right: 25 //set that fits the best
    }
  },
  tooltips: {
    mode: "index",
    intersect: false,
    callbacks: {
      label: function(tooltipItems, data) {
        return "$" + tooltipItems.yLabel;
      }
    },
    displayColors: false
  },
  hover: {
    mode: "index",
    intersect: false
  },
  maintainAspectRatio: false,
  responsive: true,
  legend: {
    display: false
  },
  scales: {
    xAxes: [
      {
        display: false
      }
    ],
    fontStyle: "bold",
    yAxes: [
      {
        gridLines: {
          color: "#373a46"
        },
        fontStyle: "bold",

        ticks: {
          callback: function(value) {
            return "$" + value.toFixed(2);
          }
        }
      }
    ]
  },
  elements: {
    point: {
      radius: 0
    },
    line: {
      borderCapStyle: "round",
      borderJoinStyle: "round"
    }
  }
};

let chartData1 = [];
let labels = [];
let allSymbols = [];
let closePrice;
let stockData = {};
let keyData = [];
let keyDataLabel = [];

export default class stockPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: "",
      funds: "",
      accountValue: "",
      fundsLoader: "",
      changeColor: "",
      extendedColor: "",
      marketStatus: "",
      valid: "",
      latestPrice: ""
    };
    fetch(
      `https://cloud.iexapis.com/beta/stock/${
        this.props.symbol
      }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=1d&changeFromClose=true`
    )
      .then((res) => res.json())
      .then((result) => {
        closePrice = result.quote.previousClose;
      });
    this.data1 = (canvas) => {
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 600, 10);
      gradient.addColorStop(0, "#7c83ff");
      gradient.addColorStop(1, "#7cf4ff");
      let gradientFill = ctx.createLinearGradient(0, 0, 0, 100);
      gradientFill.addColorStop(0, "rgba(124, 131, 255,.3)");
      gradientFill.addColorStop(0.2, "rgba(124, 244, 255,.15)");
      gradientFill.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      return {
        labels: labels,
        datasets: [
          {
            lineTension: 0.1,
            label: "",
            pointBorderWidth: 0,
            pointHoverRadius: 0,
            borderColor: gradient,
            backgroundColor: gradientFill,
            fill: true,
            borderWidth: 1,
            data: chartData1
          }
        ]
      };
    };
  }
  numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  routeChange(path) {
    this.props.history.push(path);
  }
  searchStocks(e) {
    document.getElementById("results").innerHTML = "";
    let b = 0;
    let filter = document.getElementById("searchBar").value.toUpperCase();
    if (e.key === "Enter") window.location = filter;
    if (filter.length === 0) {
      document.getElementById("results").innerHTML = "";
      document.getElementById("results").style.display = "none";
    } else {
      for (let i = 0; i < allSymbols.length; i++) {
        let splitSymbol = allSymbols[i].symbol.split("");
        let splitFilter = filter.split("");
        for (let a = 0; a < splitFilter.length; a++) {
          if (
            allSymbols[i].symbol.indexOf(filter) > -1 &&
            splitSymbol[a] === splitFilter[a]
          ) {
            if (a === 0) {
              document.getElementById("results").style.display = "flex";
              $("#results").append(
                `<li><a href=${allSymbols[i].symbol}><h4>${
                  allSymbols[i].symbol
                }</h4><h6>${allSymbols[i].name}</h6></a></li>`
              );
              b++;
            }
          }
        }
        if (b === 10) break;
      }
    }
  }
  getOneDayChart() {
    const anno = {
      annotations: [
        {
          borderDash: [2, 2],
          drawTime: "afterDatasetsDraw",
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-0",
          value: closePrice,
          borderColor: "#676976",
          borderWidth: 1
        }
      ]
    };
    labels = [];
    chartData1 = [];
    const stockApi = `https://cloud.iexapis.com/beta/stock/${
      this.props.symbol
    }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=1d&changeFromClose=true`;
    fetch(stockApi)
      .then((res) => res.json())
      .then((result) => {
        for (let i = 0; i < result.chart.length; i++) {
          if (result.chart[i].average !== null) {
            chartData1.push(result.chart[i].average.toFixed(2));
            labels.push(result.chart[i].label);
          }
        }
      })
      .then(() => {
        setTimeout(() => {
          this.setState({
            loaded: true
          });
        }, 500);
      });
    options.annotation = anno;
  }
  getYTDChart() {
    labels = [];
    chartData1 = [];
    const stockApi = `https://cloud.iexapis.com/beta/stock/${
      this.props.symbol
    }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=ytd`;
    fetch(stockApi)
      .then((res) => res.json())
      .then((result) => {
        for (let i = 0; i < result.chart.length; i++) {
          if (result.chart[i].average !== null) {
            chartData1.push(result.chart[i].close.toFixed(2));
            labels.push(result.chart[i].label);
          }
        }
      })
      .then(() => {
        setTimeout(() => {
          this.setState({
            loaded: true
          });
        }, 500);
      });
    options.annotation = "";
  }
  getOneYearChart() {
    labels = [];
    chartData1 = [];
    const stockApi = `https://cloud.iexapis.com/beta/stock/${
      this.props.symbol
    }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=1y`;
    fetch(stockApi)
      .then((res) => res.json())
      .then((result) => {
        for (let i = 0; i < result.chart.length; i++) {
          if (result.chart[i].average !== null) {
            chartData1.push(result.chart[i].close.toFixed(2));
            labels.push(result.chart[i].label);
          }
        }
      })
      .then(() => {
        setTimeout(() => {
          this.setState({
            loaded: true
          });
        }, 500);
      });
    options.annotation = "";
  }
  getTwoYearChart() {
    labels = [];
    chartData1 = [];
    const stockApi = `https://cloud.iexapis.com/beta/stock/${
      this.props.symbol
    }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=2y`;
    fetch(stockApi)
      .then((res) => res.json())
      .then((result) => {
        for (let i = 0; i < result.chart.length; i++) {
          if (result.chart[i].average !== null) {
            chartData1.push(result.chart[i].close.toFixed(2));
            labels.push(result.chart[i].label);
          }
        }
      })
      .then(() => {
        setTimeout(() => {
          this.setState({
            loaded: true
          });
        }, 500);
      });
    options.annotation = "";
  }
  getOneMonthChart() {
    labels = [];
    chartData1 = [];
    const stockApi = `https://cloud.iexapis.com/beta/stock/${
      this.props.symbol
    }/batch?token=pk_95c4a35c80274553987b93e74bb825d7&types=chart,quote&range=1m`;
    fetch(stockApi)
      .then((res) => res.json())
      .then((result) => {
        for (let i = 0; i < result.chart.length; i++) {
          if (result.chart[i].average !== null) {
            chartData1.push(result.chart[i].close.toFixed(2));
            labels.push(result.chart[i].label);
          }
        }
        console.log(chartData1);
      })
      .then(() => {
        setTimeout(() => {
          this.setState({
            loaded: true
          });
        }, 1000);
      });
    options.annotation = "";
  }
  abbrNum(number, decPlaces) {
    // 2 decimal places => 100, 3 => 1000, etc
    decPlaces = Math.pow(10, decPlaces);

    // Enumerate number abbreviations
    var abbrev = ["k", "m", "b", "t"];

    // Go through the array backwards, so we do the largest first
    for (var i = abbrev.length - 1; i >= 0; i--) {
      // Convert array index to "1000", "1000000", etc
      var size = Math.pow(10, (i + 1) * 3);

      // If the number is bigger or equal do the abbreviation
      if (size <= number) {
        // Here, we multiply by decPlaces, round, and then divide by decPlaces.
        // This gives us nice rounding to a particular decimal place.
        number = Math.round((number * decPlaces) / size) / decPlaces;

        // Handle special case where we round up to the next abbreviation
        if (number === 1000 && i < abbrev.length - 1) {
          number = 1;
          i++;
        }

        // Add the letter for the abbreviation
        number += abbrev[i];

        // We are done... stop
        break;
      }
    }

    return number;
  }
  isInArray(arr, val) {
    return arr.indexOf(val) > -1;
  }
  changeFocus(option) {
    setTimeout(() => {
      if (option === 1) {
        document.getElementById("1d").classList.add("active");
        document.getElementById("1m").className = "";
        document.getElementById("ytd").className = "";

        document.getElementById("1y").className = "";

        document.getElementById("2y").className = "";
      }
      if (option === 2) {
        document.getElementById("1m").classList.add("active");
        document.getElementById("1d").className = "";
        document.getElementById("ytd").className = "";

        document.getElementById("1y").className = "";

        document.getElementById("2y").className = "";
      }
      if (option === 3) {
        document.getElementById("1y").classList.add("active");
        document.getElementById("1d").className = "";
        document.getElementById("ytd").className = "";

        document.getElementById("1m").className = "";

        document.getElementById("2y").className = "";
      }
      if (option === 4) {
        document.getElementById("2y").classList.add("active");
        document.getElementById("1d").className = "";
        document.getElementById("ytd").className = "";

        document.getElementById("1m").className = "";

        document.getElementById("1y").className = "";
      }
      if (option === 5) {
        document.getElementById("ytd").classList.add("active");
        document.getElementById("1d").className = "";
        document.getElementById("2y").className = "";

        document.getElementById("1m").className = "";

        document.getElementById("1y").className = "";
      }
    }, 1000);
  }
  componentDidMount() {
    if (this.isInArray(this.props.symbol)) this.setState({valid: true});
    else this.setState({valid: false});
    fetch(
      "https://cloud.iexapis.com/stable/ref-data/symbols?token=pk_95c4a35c80274553987b93e74bb825d7"
    )
      .then((res) => res.json())
      .then((result) => {
        allSymbols = result.map((val) => {
          return val;
        });
      });
    fetch(
      `https://cloud.iexapis.com/beta/stock/${
        this.props.symbol
      }/realtime-update?token=pk_95c4a35c80274553987b93e74bb825d7&last=3&changeFromClose=true`
    )
      .then((res) => res.json())
      .then((result) => {
        stockData.name = result.quote.companyName;
        stockData.previousClose = result.quote.previousClose;
        stockData.latestTime = result.quote.latestTime;
        stockData.extendedPrice = result.quote.extendedPrice;
        stockData.extendedChange = result.quote.extendedChange.toFixed(2);
        this.setState({
          latestPrice: result.quote.latestPrice.toFixed(2)
        });
        stockData.change = result.quote.change.toFixed(2);
        stockData.changePercent = (
          result.quote.changePercent / Math.pow(10, -2)
        ).toFixed(2);
        keyData[0] = this.abbrNum(result.quote.marketCap, 2);
        keyDataLabel[0] = "Market Cap ";
        keyData[1] = result.quote.peRatio;
        keyDataLabel[1] = "PE Ratio (TTM) ";

        keyData[2] = "$" + result.quote.week52High;
        keyDataLabel[2] = "52 week High";

        keyData[3] = "$" + result.quote.week52Low;
        keyDataLabel[3] = "52 Week Low ";

        keyData[4] =
          (result.quote.ytdChange / Math.pow(10, -2)).toFixed(2) + "%";
        keyDataLabel[4] = "YTD Change ";

        keyData[5] = this.numberWithCommas(result.quote.latestVolume);
        keyDataLabel[5] = "Volume ";
      });
    document.title = "Trader24 - " + this.props.symbol;
    fetch("https://financialmodelingprep.com/api/v3/is-the-market-open")
      .then((res) => res.json())
      .then((result) => {
        if (result.isTheStockMarketOpen)
          document.getElementById("panel__status").style.color = "#5efad7";
        else document.getElementById("panel__status").style.color = "#eb5887";
        if (result.isTheStockMarketOpen) this.setState({marketStatus: true});
        else this.setState({marketStatus: false});
        document.getElementById(
          "panel__status"
        ).innerHTML = result.isTheStockMarketOpen
          ? "Market status: Open"
          : "Market status: Closed";
      });
    let user = firebase.auth().currentUser.uid;
    let docRef = db.collection("users").doc(user);

    docRef
      .get()
      .then((doc) => {
        this.setState({
          funds: "$" + this.numberWithCommas(doc.data()["currentfunds"])
        });
        this.setState({
          fundsLoader: true
        });
      })
      .catch(function(error) {
        console.log("Error getting document:", error);
      });
    this.getYTDChart();
    setTimeout(() => {
      if (stockData.change > 0) {
        this.setState({
          changeColor: "#66F9DA"
        });
      } else {
        this.setState({
          changeColor: "#F45385"
        });
      }
      if (stockData.extendedChange > 0) {
        this.setState({
          extendedColor: "#66F9DA"
        });
      } else {
        this.setState({
          extendedColor: "#F45385"
        });
      }
    }, 1500);
    if (this.state.marketStatus) {
      setInterval(() => {
        fetch(
          `https://cloud.iexapis.com/stable/stock/${
            this.props.symbol
          }/price?token=pk_95c4a35c80274553987b93e74bb825d7`
        )
          .then((res) => res.json())
          .then((result) => {
            this.setState({
              latestPrice: result.toFixed(2)
            });
          });
      }, 10000);
    }
  }
  render() {
    let user = firebase.auth().currentUser.displayName;
    return (
      <div className="stock">
        <div style={{display: "flex", height: "100%"}}>
          <div className="leftbar">
            <img
              className="topbar__logo"
              src={require("../images/logo.png")}
              alt="logo"
            />
            <ul className="leftbar__menu">
              <li onClick={() => this.routeChange("/dashboard")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  x="0px"
                  y="0px"
                  viewBox="0 0 24 30"
                  xmlSpace="preserve"
                >
                  <path d="M15.4,23.2H8.8c0,0-0.1,0-0.1,0c-0.4,0-0.8,0-1.2,0c0,0,0,0,0,0c-0.8,0-1.2,0-1.7-0.1c-1.8-0.4-3.3-1.9-3.7-3.7  C2,18.8,2,18.2,2,16.7v-4.4c0-1.4,0-2.4,0.1-3.2c0.1-0.9,0.2-1.5,0.5-2c0-0.1,0.1-0.2,0.1-0.3c0.3-0.5,0.8-1,1.5-1.4  C4.9,4.9,5.8,4.4,7,3.8l3.1-1.7c0.5-0.3,0.9-0.5,1.1-0.6c0.6-0.3,1-0.3,1.6,0c0.3,0.1,0.6,0.3,1.1,0.6l2.9,1.6  c1.2,0.7,2.2,1.2,2.9,1.7c0.8,0.5,1.2,1,1.5,1.6c0.3,0.6,0.5,1.2,0.6,2.1C22,9.9,22,11,22,12.4v4.3c0,1.5,0,2.1-0.1,2.7  c-0.4,1.8-1.9,3.3-3.7,3.7c-0.4,0.1-0.9,0.1-1.7,0.1c0,0-0.1,0-0.1,0c-0.1,0-0.4,0-0.8,0C15.5,23.2,15.4,23.2,15.4,23.2z M16.4,21.3  c0,0,0.1,0,0.1,0l0,0c0.7,0,1,0,1.2-0.1c1.1-0.3,2-1.1,2.2-2.2c0.1-0.3,0.1-0.9,0.1-2.2v-4.3c0-1.4,0-2.4-0.1-3.2  c-0.1-0.8-0.2-1.1-0.3-1.3c-0.1-0.2-0.3-0.5-1-0.9c-0.6-0.4-1.6-1-2.7-1.6L13,3.8c-0.5-0.3-0.7-0.4-1-0.5c0,0,0,0,0,0c0,0,0,0,0,0  c-0.2,0.1-0.5,0.3-1,0.5L8,5.5C6.8,6.2,6,6.6,5.4,7C4.8,7.4,4.6,7.7,4.5,7.9c0,0-0.1,0.1-0.1,0.2C4.3,8.3,4.1,8.6,4.1,9.3  C4,10,4,11,4,12.3v4.4c0,1.3,0,1.9,0.1,2.2c0.3,1.1,1.1,2,2.2,2.2c0.2,0.1,0.5,0.1,1.2,0.1c0.1,0,0.2,0,0.3,0v-6.7c0-0.6,0.4-1,1-1  h6.5c0.6,0,1,0.4,1,1V21.3z M9.8,15.5v5.7c2,0,3.5,0,4.5,0v-5.7H9.8z" />
                </svg>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  x="0px"
                  y="0px"
                  viewBox="0 0 47 58.75"
                  xmlSpace="preserve"
                >
                  <path d="M46.241,8.663c-0.003-0.052-0.007-0.104-0.016-0.156c-0.008-0.048-0.02-0.095-0.031-0.142  c-0.013-0.047-0.026-0.092-0.043-0.138c-0.018-0.047-0.038-0.091-0.06-0.136c-0.021-0.042-0.043-0.083-0.067-0.125  c-0.026-0.043-0.056-0.083-0.086-0.124c-0.028-0.037-0.057-0.072-0.088-0.106c-0.038-0.041-0.078-0.078-0.12-0.114  c-0.021-0.018-0.037-0.04-0.06-0.057c-0.013-0.01-0.026-0.016-0.039-0.025c-0.044-0.032-0.091-0.06-0.139-0.087  c-0.041-0.023-0.08-0.047-0.122-0.066c-0.041-0.019-0.085-0.034-0.129-0.049c-0.051-0.018-0.102-0.036-0.153-0.047  c-0.038-0.009-0.078-0.014-0.117-0.02c-0.061-0.009-0.12-0.017-0.181-0.019c-0.014,0-0.027-0.004-0.041-0.004  c-0.025,0-0.049,0.006-0.073,0.007c-0.061,0.003-0.119,0.008-0.179,0.018c-0.041,0.007-0.081,0.017-0.121,0.027  c-0.054,0.014-0.105,0.029-0.157,0.048c-0.041,0.016-0.08,0.034-0.119,0.052c-0.048,0.023-0.093,0.047-0.138,0.075  c-0.04,0.024-0.077,0.051-0.113,0.079c-0.04,0.03-0.078,0.06-0.115,0.094c-0.038,0.036-0.073,0.074-0.107,0.113  c-0.02,0.022-0.042,0.04-0.061,0.063L32.512,22.034v-2.3c0-0.157-0.031-0.305-0.075-0.448c-0.007-0.021-0.013-0.042-0.021-0.063  c-0.062-0.171-0.154-0.325-0.27-0.46c-0.008-0.009-0.01-0.021-0.018-0.029c-0.009-0.01-0.02-0.016-0.028-0.025  c-0.039-0.042-0.082-0.078-0.126-0.115c-0.032-0.027-0.063-0.056-0.098-0.081c-0.043-0.03-0.089-0.055-0.135-0.081  c-0.039-0.022-0.077-0.045-0.118-0.064c-0.045-0.02-0.092-0.034-0.139-0.05c-0.046-0.015-0.092-0.032-0.139-0.043  c-0.043-0.01-0.087-0.014-0.132-0.02c-0.055-0.008-0.109-0.015-0.165-0.017c-0.014,0-0.025-0.004-0.038-0.004  c-0.029,0-0.058,0.007-0.087,0.009c-0.058,0.003-0.114,0.007-0.171,0.017c-0.043,0.008-0.084,0.019-0.126,0.03  c-0.053,0.014-0.104,0.029-0.155,0.048c-0.042,0.016-0.082,0.036-0.122,0.056c-0.047,0.023-0.093,0.046-0.137,0.074  c-0.042,0.027-0.081,0.058-0.121,0.088c-0.026,0.021-0.056,0.037-0.082,0.06L17.617,29.715v-1.82c0-0.012-0.003-0.022-0.003-0.034  c-0.001-0.056-0.009-0.11-0.017-0.165c-0.006-0.044-0.009-0.088-0.019-0.131c-0.011-0.047-0.028-0.092-0.043-0.139  c-0.016-0.048-0.03-0.096-0.05-0.142c-0.017-0.038-0.04-0.074-0.06-0.111c-0.028-0.051-0.056-0.101-0.089-0.147  c-0.006-0.009-0.01-0.02-0.017-0.028c-0.02-0.026-0.043-0.046-0.064-0.07c-0.036-0.042-0.071-0.083-0.112-0.121  c-0.035-0.033-0.072-0.062-0.11-0.091c-0.039-0.03-0.077-0.061-0.118-0.086c-0.042-0.027-0.085-0.049-0.129-0.07  c-0.043-0.021-0.085-0.043-0.13-0.061c-0.046-0.018-0.094-0.03-0.142-0.044c-0.045-0.013-0.091-0.025-0.138-0.033  c-0.054-0.01-0.107-0.013-0.162-0.017c-0.032-0.002-0.063-0.01-0.097-0.01c-0.012,0-0.022,0.003-0.034,0.004  c-0.055,0.001-0.11,0.009-0.165,0.017c-0.044,0.006-0.088,0.009-0.131,0.019c-0.047,0.011-0.093,0.028-0.14,0.043  c-0.047,0.016-0.095,0.03-0.14,0.05c-0.04,0.018-0.078,0.042-0.116,0.063c-0.048,0.026-0.096,0.053-0.141,0.084  c-0.01,0.007-0.021,0.012-0.03,0.019L1.353,37.048c-0.027,0.021-0.049,0.046-0.075,0.068c-0.04,0.034-0.08,0.068-0.116,0.106  c-0.034,0.036-0.063,0.074-0.092,0.112s-0.06,0.076-0.086,0.118c-0.026,0.041-0.047,0.084-0.069,0.127  c-0.022,0.044-0.043,0.087-0.061,0.133c-0.018,0.045-0.03,0.092-0.043,0.139c-0.013,0.047-0.026,0.093-0.034,0.141  c-0.009,0.053-0.013,0.106-0.016,0.16c-0.002,0.033-0.01,0.064-0.01,0.098c0,0.012,0.003,0.022,0.003,0.034  c0.001,0.056,0.009,0.11,0.017,0.165c0.006,0.044,0.009,0.088,0.019,0.131c0.011,0.047,0.028,0.092,0.043,0.139  c0.016,0.048,0.03,0.096,0.05,0.142c0.017,0.038,0.04,0.074,0.06,0.111c0.028,0.05,0.056,0.101,0.089,0.147  c0.006,0.009,0.01,0.02,0.017,0.028c0.014,0.02,0.033,0.032,0.048,0.051c0.049,0.06,0.101,0.115,0.159,0.167  c0.03,0.026,0.061,0.052,0.092,0.076c0.056,0.042,0.115,0.079,0.176,0.113c0.033,0.019,0.065,0.039,0.1,0.055  c0.07,0.032,0.145,0.057,0.221,0.078c0.028,0.008,0.054,0.02,0.082,0.025c0.104,0.023,0.212,0.037,0.323,0.037h42.5  c0.828,0,1.5-0.672,1.5-1.5V8.75C46.25,8.72,46.243,8.692,46.241,8.663z M14.692,33.518c0.007,0.022,0.013,0.044,0.021,0.066  c0.062,0.169,0.153,0.321,0.268,0.455c0.008,0.011,0.01,0.023,0.019,0.033c0.009,0.01,0.021,0.018,0.03,0.027  c0.044,0.046,0.093,0.087,0.142,0.128c0.03,0.024,0.058,0.052,0.089,0.073c0.058,0.04,0.12,0.072,0.183,0.104  c0.027,0.014,0.052,0.031,0.08,0.043c0.085,0.037,0.175,0.064,0.268,0.085c0.007,0.002,0.013,0.005,0.02,0.007  c0.099,0.021,0.201,0.031,0.306,0.031l0,0c0,0,0,0,0,0h0c0.171,0,0.333-0.035,0.486-0.088c0.019-0.007,0.038-0.011,0.057-0.018  c0.157-0.062,0.298-0.15,0.425-0.258c0.01-0.009,0.022-0.011,0.032-0.02l12.394-11.098v3.313c0,0.03,0.007,0.058,0.009,0.087  c0.003,0.053,0.007,0.105,0.016,0.157c0.008,0.048,0.02,0.094,0.031,0.14c0.013,0.047,0.026,0.094,0.043,0.14  c0.018,0.046,0.037,0.09,0.059,0.134c0.021,0.043,0.044,0.085,0.069,0.127s0.055,0.081,0.084,0.12  c0.028,0.038,0.058,0.074,0.09,0.109c0.037,0.04,0.076,0.076,0.117,0.111c0.021,0.019,0.039,0.041,0.062,0.059  c0.009,0.007,0.019,0.009,0.027,0.015c0.116,0.087,0.244,0.156,0.383,0.207c0.027,0.009,0.053,0.017,0.08,0.024  c0.137,0.041,0.278,0.069,0.428,0.07c0.001,0,0.001,0,0.002,0c0,0,0,0,0.001,0l0,0c0.109,0,0.216-0.014,0.318-0.036  c0.027-0.006,0.053-0.017,0.079-0.024c0.076-0.021,0.15-0.044,0.222-0.076c0.033-0.016,0.064-0.035,0.097-0.053  c0.062-0.033,0.12-0.069,0.176-0.11c0.032-0.023,0.062-0.05,0.091-0.075c0.056-0.048,0.105-0.1,0.153-0.155  c0.015-0.018,0.033-0.03,0.048-0.049L43.25,13.12v23.63H6.766l7.851-5.863v2.185C14.617,33.228,14.648,33.376,14.692,33.518z" />
                </svg>
              </li>
              <li onClick={() => this.routeChange("stocks")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  x="0px"
                  y="0px"
                  viewBox="0.5 24.5 24 30"
                  xmlSpace="preserve"
                >
                  <g>
                    <path d="M10.5,24.5c-5.523,0-10,4.478-10,10s4.478,10,10,10v-10h10C20.5,28.978,16.022,24.5,10.5,24.5z M8.5,34.5v7.747   c-3.447-0.891-6-4.026-6-7.747c0-4.411,3.589-8,8-8c3.721,0,6.856,2.554,7.747,6H10.5C9.396,32.5,8.5,33.396,8.5,34.5z" />
                    <path d="M12.5,36.5v10c5.522,0,10-4.478,10-10H12.5z" />
                  </g>
                </svg>
              </li>
            </ul>
            <h5 className="panel__status" id="panel__status">
              {" "}
            </h5>
            <svg
              className="leftbar__log"
              onClick={() => logout()}
              viewBox="0 0 512.016 512"
            >
              <path d="m496 240.007812h-202.667969c-8.832031 0-16-7.167968-16-16 0-8.832031 7.167969-16 16-16h202.667969c8.832031 0 16 7.167969 16 16 0 8.832032-7.167969 16-16 16zm0 0" />
              <path d="m416 320.007812c-4.097656 0-8.191406-1.558593-11.308594-4.691406-6.25-6.253906-6.25-16.386718 0-22.636718l68.695313-68.691407-68.695313-68.695312c-6.25-6.25-6.25-16.382813 0-22.632813 6.253906-6.253906 16.386719-6.253906 22.636719 0l80 80c6.25 6.25 6.25 16.382813 0 22.632813l-80 80c-3.136719 3.15625-7.230469 4.714843-11.328125 4.714843zm0 0" />
              <path d="m170.667969 512.007812c-4.566407 0-8.898438-.640624-13.226563-1.984374l-128.386718-42.773438c-17.46875-6.101562-29.054688-22.378906-29.054688-40.574219v-384c0-23.53125 19.136719-42.6679685 42.667969-42.6679685 4.5625 0 8.894531.6406255 13.226562 1.9843755l128.382813 42.773437c17.472656 6.101563 29.054687 22.378906 29.054687 40.574219v384c0 23.53125-19.132812 42.667968-42.664062 42.667968zm-128-480c-5.867188 0-10.667969 4.800782-10.667969 10.667969v384c0 4.542969 3.050781 8.765625 7.402344 10.28125l127.785156 42.582031c.917969.296876 2.113281.46875 3.480469.46875 5.867187 0 10.664062-4.800781 10.664062-10.667968v-384c0-4.542969-3.050781-8.765625-7.402343-10.28125l-127.785157-42.582032c-.917969-.296874-2.113281-.46875-3.476562-.46875zm0 0" />
              <path d="m325.332031 170.675781c-8.832031 0-16-7.167969-16-16v-96c0-14.699219-11.964843-26.667969-26.664062-26.667969h-240c-8.832031 0-16-7.167968-16-16 0-8.832031 7.167969-15.9999995 16-15.9999995h240c32.363281 0 58.664062 26.3046875 58.664062 58.6679685v96c0 8.832031-7.167969 16-16 16zm0 0" />
              <path d="m282.667969 448.007812h-85.335938c-8.832031 0-16-7.167968-16-16 0-8.832031 7.167969-16 16-16h85.335938c14.699219 0 26.664062-11.96875 26.664062-26.667968v-96c0-8.832032 7.167969-16 16-16s16 7.167968 16 16v96c0 32.363281-26.300781 58.667968-58.664062 58.667968zm0 0" />
            </svg>
          </div>
          <div className="stockPage">
            <div className="topbar">
              <div className="topbar__searchbar" id="topbar__searchbar">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%"
                  }}
                >
                  <svg
                    enableBackground="new 0 0 250.313 250.313"
                    version="1.1"
                    viewBox="0 0 250.313 250.313"
                    xmlSpace="preserve"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    />
                  </svg>
                  <input
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    type="text"
                    id="searchBar"
                    onKeyUp={this.searchStocks}
                    placeholder="Search by symbol"
                    onFocus={() => {
                      if (document.getElementById("results").firstChild)
                        document.getElementById("results").style.display =
                          "flex";
                      document.getElementById(
                        "topbar__searchbar"
                      ).style.boxShadow = "0px 0px 30px 0px rgba(0,0,0,0.10)";
                      document.getElementById("results").style.boxShadow =
                        "0px 30px 30px 0px rgba(0,0,0,0.10)";
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        document.getElementById("results").style.display =
                          "none";
                      }, 400);
                      document.getElementById(
                        "topbar__searchbar"
                      ).style.boxShadow = "none";
                    }}
                    autoComplete="off"
                  />
                </div>
                <ul className="topbar__results" id="results" />
              </div>
              <div className="topbar__container">
                <div className="topbar__user">
                  {this.state.fundsLoader === true && (
                    <div className="topbar__power">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <g>
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d="M18 7h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h15v4zM4 9v10h16V9H4zm0-4v2h12V5H4zm11 8h3v2h-3v-2z" />
                        </g>
                      </svg>
                      <h3>{this.state.funds}</h3>
                    </div>
                  )}
                  <span className="leftbar__name"> &nbsp;{user}</span>
                </div>
              </div>
            </div>
            {this.state.loaded ? (
              <div className="stockPage__top">
                <div className="stock__chart">
                  <div className="stock__info">{stockData.companyName}</div>
                  <Line data={this.data1} options={options} />
                  <div className="stockPage__timers">
                    <h6
                      id="2y"
                      onClick={() => {
                        this.getTwoYearChart();
                        this.changeFocus(4);
                      }}
                    >
                      2Y
                    </h6>
                    <h6
                      id="1y"
                      onClick={() => {
                        this.getOneYearChart();
                        this.changeFocus(3);
                      }}
                    >
                      1Y
                    </h6>

                    <h6
                      id="ytd"
                      className="active"
                      onClick={() => {
                        this.classList = "active";
                        this.changeFocus(5);
                        this.getYTDChart();
                      }}
                    >
                      YTD
                    </h6>
                    <h6
                      id="1m"
                      onClick={function() {
                        this.changeFocus(2);
                        this.getOneMonthChart();
                      }.bind(this)}
                    >
                      1M
                    </h6>
                    <h6
                      id="1d"
                      onClick={() => {
                        this.changeFocus(1);
                        this.getOneDayChart();
                      }}
                    >
                      1D
                    </h6>
                  </div>
                </div>
                <div className="stockPage__trade">
                  <h4>{stockData.name}</h4>
                  <div className="stockPage__trade-top">
                    <h2>${this.state.latestPrice}</h2>
                    <h6 style={{color: this.state.changeColor}}>
                      {stockData.change} ({stockData.changePercent}%)
                    </h6>
                  </div>
                  {!this.state.marketStatus && (
                    <h6>
                      Extended Hours:{" "}
                      <span style={{color: this.state.extendedColor}}>
                        ${stockData.extendedPrice} ({stockData.extendedChange})
                      </span>
                    </h6>
                  )}
                  <h5>Buy {this.props.symbol}</h5>
                </div>
              </div>
            ) : (
              <ul className="loader">
                <li />
                <li />
                <li />
              </ul>
            )}
            <div className="stockPage__keyStats">
              <div className="data">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g>
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M12 22C6.477 22 2 17.523 2 12c0-4.478 2.943-8.268 7-9.542v2.124A8.003 8.003 0 0 0 12 20a8.003 8.003 0 0 0 7.418-5h2.124c-1.274 4.057-5.064 7-9.542 7zm9.95-9H11V2.05c.329-.033.663-.05 1-.05 5.523 0 10 4.477 10 10 0 .337-.017.671-.05 1zM13 4.062V11h6.938A8.004 8.004 0 0 0 13 4.062z" />
                    </g>
                  </svg>{" "}
                  Key Informations
                </h3>
                <div className="stockPage__columns">
                  {keyData.map((val, index) => {
                    return (
                      <div className="data__info" key={index}>
                        <h5 className="data__label">{keyDataLabel[index]}</h5>
                        <h4>{val}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="news">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g>
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M4.929 2.929l1.414 1.414A7.975 7.975 0 0 0 4 10c0 2.21.895 4.21 2.343 5.657L4.93 17.07A9.969 9.969 0 0 1 2 10a9.969 9.969 0 0 1 2.929-7.071zm14.142 0A9.969 9.969 0 0 1 22 10a9.969 9.969 0 0 1-2.929 7.071l-1.414-1.414A7.975 7.975 0 0 0 20 10c0-2.21-.895-4.21-2.343-5.657L19.07 2.93zM7.757 5.757l1.415 1.415A3.987 3.987 0 0 0 8 10c0 1.105.448 2.105 1.172 2.828l-1.415 1.415A5.981 5.981 0 0 1 6 10c0-1.657.672-3.157 1.757-4.243zm8.486 0A5.981 5.981 0 0 1 18 10a5.981 5.981 0 0 1-1.757 4.243l-1.415-1.415A3.987 3.987 0 0 0 16 10a3.987 3.987 0 0 0-1.172-2.828l1.415-1.415zM12 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-1 2h2v8h-2v-8z" />
                    </g>
                  </svg>
                  Latest News
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
