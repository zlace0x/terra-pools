(this["webpackJsonpterra-pools"]=this["webpackJsonpterra-pools"]||[]).push([[0],{172:function(t,e){},580:function(t,e){},582:function(t,e){},593:function(t,e){},595:function(t,e){},607:function(t,e){},609:function(t,e){},610:function(t,e){},734:function(t,e,n){},735:function(t,e,n){},870:function(t,e,n){"use strict";n.r(e);var a=n(35),c=n(0),i=n.n(c),r=n(195),o=n.n(r),s=n(157),u=(n(734),n(7)),l=n(26),b=n(2),j=n.n(b),p=(n(735),n(880)),f=n(457),h=n(453),d=n(451),m=n(444),O=n(454),x=n(53),g=["#0088FE","#FFBB28"];var v=function(){var t=Object(c.useState)([]),e=Object(l.a)(t,2),n=e[0],a=e[1],i=Object(c.useState)([49e6,51e6]),r=Object(l.a)(i,2),o=r[0],b=r[1],v=Object(s.c)();return Object(c.useEffect)((function(){var t=function(){var t=Object(u.a)(j.a.mark((function t(){var e,n,c,i,r,o,s;return j.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,v.market.poolDelta();case 2:return e=t.sent,t.next=5,v.market.parameters();case 5:n=t.sent,c=n.base_pool,i=c.plus(e),r=c.pow(2).div(i),o=i.times(1e-6).toNumber(),s=r.times(1e-6).toNumber(),a([{name:"Stablecoins",amt:o},{name:"LUNA",amt:s}]),b(o<49e6||s<49e6?[4e7,6e7]:[49e6,51e6]);case 13:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}();t();var e=setInterval(t,7e3);return function(){clearTimeout(e)}}),[v.market]),Object(x.jsxs)("div",{className:"App",children:[Object(x.jsxs)("center",{children:[Object(x.jsx)("h1",{children:"Terra Virtual Liquidity Pools"}),Object(x.jsxs)(p.a,{width:800,height:400,data:n,children:[Object(x.jsxs)(f.a,{isAnimationActive:!1,label:!1,dataKey:"amt",children:[n.map((function(t,e){return Object(x.jsx)(h.a,{fill:g[e%20]},"cell-".concat(e))})),Object(x.jsx)(d.a,{dataKey:"name",position:"top"})]}),Object(x.jsx)(m.a,{isFront:!1,label:{position:"top",value:"BasePool"},y:5e7,stroke:"#000"}),Object(x.jsx)(O.a,{hide:!0,type:"number",ticks:10,stroke:"#000000",interval:0,domain:o})]})]}),Object(x.jsx)("a",{style:{position:"fixed",right:0,top:0},href:"https://github.com/octalmage/terra-pools",children:Object(x.jsx)("img",{loading:"lazy",width:"149",height:"149",src:"https://github.blog/wp-content/uploads/2008/12/forkme_right_darkblue_121621.png?resize=149%2C149",class:"attachment-full size-full",alt:"Fork me on GitHub","data-recalc-dims":"1"})})]})},k=function(t){t&&t instanceof Function&&n.e(3).then(n.bind(null,881)).then((function(e){var n=e.getCLS,a=e.getFID,c=e.getFCP,i=e.getLCP,r=e.getTTFB;n(t),a(t),c(t),i(t),r(t)}))};Object(s.b)().then((function(t){o.a.render(Object(x.jsx)(i.a.StrictMode,{children:Object(x.jsx)(s.a,Object(a.a)(Object(a.a)({},t),{},{children:Object(x.jsx)(v,{})}))}),document.getElementById("root"))})),k()}},[[870,1,2]]]);
//# sourceMappingURL=main.15857190.chunk.js.map