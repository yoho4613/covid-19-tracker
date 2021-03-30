(this["webpackJsonpcovid-19-tracker"]=this["webpackJsonpcovid-19-tracker"]||[]).push([[0],{126:function(e,t,c){},163:function(e,t,c){},165:function(e,t,c){},170:function(e,t,c){},171:function(e,t,c){},268:function(e,t,c){"use strict";c.r(t);var n=c(0),a=c.n(n),s=c(7),r=c.n(s),o=(c(163),c(41)),i=c.n(o),l=c(77),u=c(23),d=c(300),j=c(301),f=c(303),h=c(294),b=c(298),v=c(152),O=c(299),p=(c(165),c(4));var x=function(e){var t=e.title,c=e.cases,n=e.active,a=e.isRed,s=e.total,r=Object(v.a)(e,["title","cases","active","isRed","total"]);return Object(p.jsx)(h.a,{className:"infoBox ".concat(n&&"infoBox--selected"," ").concat(a&&"infoBox--red"),onClick:r.onClick,children:Object(p.jsxs)(b.a,{children:[Object(p.jsx)(O.a,{className:"infoBox__title",color:"textSecondary",children:t}),Object(p.jsx)("h2",{className:"infoBox__cases ".concat(!a&&"infoBox__cases--green"),children:c}),Object(p.jsxs)(O.a,{className:"infoBox__total",color:"textSecondary",children:[s," Total"]})]})})},m=(c(170),c(302)),g=c(306),y=(c(126),c(151)),C=c(26),_=c.n(C),w=c(304),N=c(305),k={cases:{hex:"#CC1034",rgb:"rgb(204, 16, 52)",half_op:"rgba(204, ,16, 52, 0.5)",multiplier:800},recovered:{hex:"#7dd71d",rgb:"rgb(125, 215, 29)",half_op:"rgba(125,215,29, 0.5)",multiplier:1200},deaths:{hex:"#fb4443",rgb:"rgb(251, 68, 67)",half_op:"rgba(251, 68, 67, 0.5)",multiplier:2e3}},S=function(e){return Object(y.a)(e).sort((function(e,t){return e.cases>t.cases?-1:1}))},I=function(e){return e?"+".concat(_()(e).format("0.0a")):"+0"},R=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"cases";return e.map((function(e){return Object(p.jsx)(w.a,{center:[e.countryInfo.lat,e.countryInfo.long],fillOpacity:.4,color:k[t].hex,fillColor:k[t].hex,radius:Math.sqrt(e[t])*k[t].multiplier,children:Object(p.jsx)(N.a,{children:Object(p.jsxs)("div",{className:"info-container",children:[Object(p.jsx)("div",{className:"info-flag",style:{backgroundImage:"url(".concat(e.countryInfo.flag,")")}}),Object(p.jsx)("div",{className:"info-name",children:e.country}),Object(p.jsxs)("div",{className:"info-cases",children:["Cases: ",_()(e.cases).format("0,0")]}),Object(p.jsxs)("div",{className:"info-recovered",children:["Recovered: ",_()(e.cases).format("0,0")]}),Object(p.jsxs)("div",{className:"info-deaths",children:["Deaths: ",_()(e.cases).format("0,0")]})]})})})}))};var B=function(e){var t=e.countries,c=e.casesType,n=e.center,a=e.zoom;return Object(p.jsx)("div",{className:"map",children:Object(p.jsxs)(m.a,{center:n,zoom:a,children:[Object(p.jsx)(g.a,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'\xa9 <a href="http://osm.org/copyright">OpenStreetMap<a> contributors'}),R(t,c)]})})};c(171);var D=function(e){var t=e.countries;return Object(p.jsx)("div",{className:"table",children:t.map((function(e){var t=e.country,c=e.cases;return Object(p.jsxs)("tr",{children:[Object(p.jsx)("td",{children:t}),Object(p.jsx)("td",{children:Object(p.jsx)("strong",{children:_()(c).format("0,0")})})]})}))})},T=c(150),E={legend:{display:!1},elements:{point:{radius:0}},maintainAspectRatio:!1,tootips:{mode:"index",intersect:!1,callbacks:{label:function(e,t){return _()(e.value).format("+0,0")}}},scales:{xAxes:[{type:"time",time:{format:"MM/DD/YY",tooltipFormat:"ll"}}],yAxes:[{gridLines:{display:!1},ticks:{callback:function(e,t,c){return _()(e).format("0a")}}}]}},F=function(e){var t,c=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"cases",n=[];for(var a in e.cases){if(t){var s={x:a,y:e[c][a]-t};n.push(s)}t=e[c][a]}return n};var L=function(e){var t=e.casesType,c=void 0===t?"cases":t,a=Object(n.useState)({}),s=Object(u.a)(a,2),r=s[0],o=s[1];return Object(n.useEffect)((function(){(function(){var e=Object(l.a)(i.a.mark((function e(){return i.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("https://disease.sh/v3/covid-19/historical/all?lastdays=30").then((function(e){return e.json()})).then((function(e){var t=F(e,"cases");console.log("chart Data >>>>>",t),o(t)}));case 2:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}})()()}),[c]),Object(p.jsx)("div",{children:(null===r||void 0===r?void 0:r.length)>0&&Object(p.jsx)(T.Line,{options:E,data:{datasets:[{backgroundColor:"rgba(204, 16, 52, 0.5)",borderColor:"#CC1034",data:r}]}})})};c(267);var M=function(){var e=Object(n.useState)([]),t=Object(u.a)(e,2),c=t[0],a=t[1],s=Object(n.useState)("worldwide"),r=Object(u.a)(s,2),o=r[0],v=r[1],O=Object(n.useState)({}),m=Object(u.a)(O,2),g=m[0],y=m[1],C=Object(n.useState)([]),_=Object(u.a)(C,2),w=_[0],N=_[1],k=Object(n.useState)({lat:34.80746,lng:-40.4796}),R=Object(u.a)(k,2),T=R[0],E=R[1],F=Object(n.useState)(3),M=Object(u.a)(F,2),z=M[0],A=M[1],J=Object(n.useState)([]),P=Object(u.a)(J,2),W=P[0],Y=P[1],q=Object(n.useState)("cases"),K=Object(u.a)(q,2),V=K[0],G=K[1];Object(n.useEffect)((function(){fetch("https://disease.sh/v3/covid-19/all").then((function(e){return e.json()})).then((function(e){y(e)}))}),[]),Object(n.useEffect)((function(){(function(){var e=Object(l.a)(i.a.mark((function e(){return i.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("https://disease.sh/v3/covid-19/countries").then((function(e){return e.json()})).then((function(e){var t=e.map((function(e){return{name:e.country,value:e.countryInfo.iso2}})),c=S(e);N(c),Y(e),a(t)})).then();case 2:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}})()()}),[]);var H=function(){var e=Object(l.a)(i.a.mark((function e(t){var c,n;return i.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return c=t.target.value,n="worldwide"===c?"https://disease.sh/v3/covid-19/all":"https://disease.sh/v3/covid-19/countries/".concat(c),e.next=4,fetch(n).then((function(e){return e.json()})).then((function(e){v(c),y(e),console.log("data=>>>>>>",e),E([e.countryInfo.lat,e.countryInfo.long]),A(4)}));case 4:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}();return Object(p.jsxs)("div",{className:"app",children:[Object(p.jsxs)("div",{className:"app__left",children:[Object(p.jsxs)("div",{className:"app__header",children:[Object(p.jsx)("h1",{children:"COVID-19-TRACKER"}),Object(p.jsx)(d.a,{className:"app__dropdown",children:Object(p.jsxs)(j.a,{variant:"outlined",onChange:H,value:o,children:[Object(p.jsx)(f.a,{value:"worldwide",children:"Worldwide"}),c.map((function(e){return Object(p.jsx)(f.a,{value:e.value,children:e.name})}))]})})]}),Object(p.jsxs)("div",{className:"app__states",children:[Object(p.jsx)(x,{isRed:!0,active:"cases"===V,onClick:function(e){return G("cases")},title:"Coronavirus cases",cases:I(g.todayCases),total:I(g.cases)}),Object(p.jsx)(x,{active:"recovered"===V,onClick:function(e){return G("recovered")},title:"Recovered",cases:I(g.todayRecovered),total:I(g.recovered)}),Object(p.jsx)(x,{isRed:!0,active:"deaths"===V,onClick:function(e){return G("deaths")},title:"Deaths",cases:I(g.todayDeaths),total:I(g.deaths)})]}),Object(p.jsx)(B,{casesType:V,countries:W,center:T,zoom:z})]}),Object(p.jsx)(h.a,{className:"app__right",children:Object(p.jsxs)(b.a,{children:[Object(p.jsx)("h3",{children:"Live Cases by Country"}),Object(p.jsx)(D,{countries:w}),Object(p.jsxs)("h3",{children:["Worldwide new ",V]}),Object(p.jsx)(L,{casesType:V})]})})]})},z=function(e){e&&e instanceof Function&&c.e(3).then(c.bind(null,308)).then((function(t){var c=t.getCLS,n=t.getFID,a=t.getFCP,s=t.getLCP,r=t.getTTFB;c(e),n(e),a(e),s(e),r(e)}))};r.a.render(Object(p.jsx)(a.a.StrictMode,{children:Object(p.jsx)(M,{})}),document.getElementById("root")),z()}},[[268,1,2]]]);
//# sourceMappingURL=main.d27d23cf.chunk.js.map