(this.webpackJsonpwebrtc_test=this.webpackJsonpwebrtc_test||[]).push([[0],{16:function(e,t,n){},38:function(e,t,n){},40:function(e,t,n){"use strict";n.r(t);var c=n(0),r=n.n(c),a=n(10),i=n.n(a),u=(n(16),n(2)),s=n.n(u),o=n(3),d=n(4),b=n(11),v=n.n(b),l=(n(38),n(1)),f=navigator.mediaDevices;function j(){return p.apply(this,arguments)}function p(){return(p=Object(d.a)(s.a.mark((function e(){var t,n,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,f.enumerateDevices();case 2:return t=e.sent,n=[],c=[],console.log(t),t.forEach((function(e){var t=e.kind;e.deviceId,e.label;switch(t){case"audioinput":c.push(e);break;case"videoinput":n.push(e)}})),e.abrupt("return",{vDevices:n,aDevices:c});case 8:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function O(e){return h.apply(this,arguments)}function h(){return(h=Object(d.a)(s.a.mark((function e(t){var n,c,r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=t.audioDeviceId,c=t.videoDeviceId,e.next=3,f.getUserMedia({video:{deviceId:c},audio:{deviceId:n}});case 3:return r=e.sent,e.abrupt("return",r);case 5:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var x=function(){var e=Object(c.useState)(null),t=Object(o.a)(e,2),n=t[0],r=t[1],a=Object(c.useState)(!1),i=Object(o.a)(a,2),u=i[0],b=i[1],f=Object(c.useState)(null),p=Object(o.a)(f,2),h=p[0],x=p[1],m=Object(c.useState)([]),w=Object(o.a)(m,2),g=w[0],D=w[1],k=Object(c.useState)([]),I=Object(o.a)(k,2),S=I[0],y=I[1],C=Object(c.useState)(""),F=Object(o.a)(C,2),E=F[0],T=F[1],J=Object(c.useState)(""),P=Object(o.a)(J,2),A=P[0],B=P[1],L=Object(c.useRef)(null),M=Object(c.useCallback)(Object(d.a)(s.a.mark((function e(){var t,n,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,j();case 2:t=e.sent,n=t.aDevices,c=t.vDevices,y((function(){return n})),D((function(){return c}));case 7:case"end":return e.stop()}}),e)}))),[]);return Object(c.useEffect)((function(){var e=new v.a({key:"bfae4862-4740-46d1-bf51-8ee9105b83f3",debug:3});e.on("open",(function(){console.log(e.id)})),r((function(){return e})),M()}),[]),Object(c.useEffect)((function(){Object(d.a)(s.a.mark((function e(){var t,n;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,O({audioDeviceId:A,videoDeviceId:E});case 2:(t=e.sent)&&L&&L.current&&((n=L.current).srcObject=t,n.play()),h&&h.replaceStream(t);case 5:case"end":return e.stop()}}),e)})))()}),[A,E]),Object(c.useEffect)((function(){Object(d.a)(s.a.mark((function e(){var t,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(u){e.next=2;break}return e.abrupt("return");case 2:if(n&&(!n||n.open)){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,O({audioDeviceId:A,videoDeviceId:E});case 6:t=e.sent,c=n.joinRoom("test-room-id",{stream:t}),x((function(){return c})),console.log(c);case 10:case"end":return e.stop()}}),e)})))()}),[u]),Object(l.jsxs)("div",{className:"App",children:[Object(l.jsxs)("div",{children:[Object(l.jsx)("label",{htmlFor:"audio-devices",children:"AudioDevice:"}),Object(l.jsx)("select",{id:"audio-devices",value:A,onChange:function(e){return B(e.currentTarget.value)},children:S.map((function(e){var t=e.deviceId,n=e.label;return Object(l.jsx)("option",{value:t,children:n},t)}))})]}),Object(l.jsxs)("div",{children:[Object(l.jsx)("label",{htmlFor:"video-devices",children:"VideoDevice:"}),Object(l.jsx)("select",{id:"video-devices",value:E,onChange:function(e){return T(e.currentTarget.value)},children:g.map((function(e){var t=e.deviceId,n=e.label;return Object(l.jsx)("option",{value:t,children:n},t)}))})]}),Object(l.jsx)("div",{children:Object(l.jsx)("button",{onClick:function(e){return b(!0)},children:"Join"})}),Object(l.jsx)("video",{ref:L,width:"400px",autoPlay:!0,muted:!0,playsInline:!0})]})},m=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,41)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,a=t.getLCP,i=t.getTTFB;n(e),c(e),r(e),a(e),i(e)}))};i.a.render(Object(l.jsx)(r.a.StrictMode,{children:Object(l.jsx)(x,{})}),document.getElementById("root")),m()}},[[40,1,2]]]);
//# sourceMappingURL=main.1a737ffc.chunk.js.map