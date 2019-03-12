var $ = function(term) {
    var t = document.querySelectorAll(term);
    if (!t) {
        return;
    } else if (t.length == 1) {
        return t[0];
    } else {
        return t;
    }
}

// if (document.readyState != 'loading'){
//   init();
// } else {
//   document.addEventListener('DOMContentLoaded', init);
// }

function bind(sel, eventName, handler) {
    var el = document.querySelectorAll(sel);
    if (!el) {
        return;
    } else {
        for (var i = 0; i < el.length; i++) {
            el[i].addEventListener(eventName, handler);
        }
    }
}

function show(id) {
    var e = document.getElementById(id);
    e.style.display = '';
    e.scrollIntoView();
}

function hide(id) {
    document.getElementById(id).style.display = 'none';
}

function disable(id) {
    document.getElementById(id).disabled = true;
}

function enable(id) {
    document.getElementById(id).disabled = false;
}

bind("#frm-vurl", "submit", function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    var re = /\/video\/av(\d+)(\/index.html|\/index_(\d+).html)?/;
    var str = $("#vurl").value;
    var arr = str.match(re);
    if (!arr || !arr[1]) {
        $("#vurl").value = "无效的视频地址";
        return false;
    }
    var aid = arr[1];
    var pid = arr[3] || 1;
    var request = new XMLHttpRequest();
    request.open('GET', apiBase + 'cid/' + aid + '/' + pid, true);

    disable("getComment");
    show('loader');

    request.onload = function() {
        enable("getComment");
        hide('loader');
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);
            if (data.error == 0) {
                window.lastCID = data.cid;
                getComment(data.cid);
            } else {
                $("#vurl").value = "请求错误";
            }
        } else {
            $("#vurl").value = "服务器错误";
        }
    };

    request.onerror = function() {
        enable("getComment");
        hide('loader');
        $("#vurl").value = "服务器错误";
    };

    request.send();
    return false;
});


function getComment(cid) {
  var request = new XMLHttpRequest();
  request.open('GET', 'https://bilibili.zscself.com/comment/' + cid + '.xml', true);
  // request.open('GET', 'https://comment.bilibili.com/' + cid + '.xml', true);

    show('loader');
    disable("getComment");

    request.onload = function() {
        hide('loader');
        if (request.status >= 200 && request.status < 400) {
            disable('vurl');
            var oParser = new DOMParser();
            var oDOM = oParser.parseFromString(request.responseText, "text/xml");
            window.commentElements = oDOM.getElementsByTagName("d");
            show('step2');
        } else {
            enable("getComment");
            $("#vurl").value = "Comment1 onload 读取弹幕失败";
        }
    };

    request.onerror = function() {
        enable("getComment");
        hide('loader');
        $("#vurl").value = "Comment1 error 读取弹幕失败";
    };

    request.send();
}

bind("#frm-searchcm", "submit", function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    var keyword = $("#cmsearch").value;
    if (!keyword) {
        return false;
    }

    disable("searchComment");
    show('loader');

    var html = '';
    var zongshu = shuaping = renshu = 0;
    var userList = [];
    for (var i = 0; i < commentElements.length; i++) {
        var n = commentElements[i].childNodes[0];
        if (n) {
            var t = n.nodeValue;
            if (t && t.indexOf(keyword) > -1) {
                zongshu++; //匹配弹幕数+1
                var un = conunt(commentElements[i], userList)
                switch (un.num) {
                    case 2:
                        html += cm_tmpl(commentElements[i]);
                        html += cm_tmpl(un.xmlnode);
                        shuaping = shuaping + 2;
                        renshu++;
                        break;
                    case 1:
                        break;
                    default:
                        html += cm_tmpl(commentElements[i]);
                        shuaping++;
                }
                // if(conunt(commentElements[i],userList)>=2){
                //   html += cm_tmpl(commentElements[i]);
                // }
            }
        }
    }
    var countHtml = '<tr><td class="mdl-data-table__cell--non-numeric" title="与关键词匹配的弹幕总数">' + zongshu + '</td><td>' + shuaping + '</td><td>'+ renshu +'</td></tr>';
    if (!html || html.length < 1) {
        html = '<tr><td>没有找到任何弹幕，请尝试变更关键词</td></tr>';
    }

    $('#cmList').innerHTML = html;
    $('#count').innerHTML = countHtml;
    enable("searchComment");
    hide('loader');
    show('step3');
    return false;
});

function contains(xmlnode, userList) {
    var pdata = xmlnode.getAttribute('p').split(',');
    var user = pdata[6];
    if (userList.length == 0) {
        userList.push(user);
        return false;
    } else {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i] == user) {
                return true;
            }
        }
        userList.push(user);
        return false;
    }
}

function conunt(xmlnode, userList) {
    var pdata = xmlnode.getAttribute('p').split(',');
    var user = pdata[6];
    var userNode = { 'num': 0, 'u': user, 'xmlnode': xmlnode };
    if (userList.length == 0) {
        userNode.num = 1;
        userList.push(userNode);
        return userNode;
    } else {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].u == user) {
                userList[i].num++;
                return userList[i];
            }
        }
        userNode.num = 1;
        userList.push(userNode);
        return userNode;
    }
}


function cm_tmpl(xmlnode) {
    var text = xmlnode.childNodes[0].nodeValue.replace(/"/g, "&quot;");
    var shorttext = text;
    if (text.length > 20) {
        shorttext = text.substr(0, 20);
    }
    var pdata = xmlnode.getAttribute('p').split(',');
    var time = parseInt(pdata[0]);
    var user = pdata[6];

    var minutes = parseInt(time / 60) % 60;
    var minutesa = minutes.toString();
    minuteslength = minutesa.length;
    if (minuteslength <= 1) {
        minutesa = '0' + minutesa;
    }
    var seconds = time % 60;
    var secondsa = seconds.toString();
    secondslength = secondsa.length;
    if (secondslength <= 1) {
        secondsa = '0' + secondsa;
    }

    var str = '<tr><td class="mdl-data-table__cell--non-numeric" title="' + text + '">' + shorttext + '</td><td>' + minutesa + ':' + secondsa + '</td>\
                 <td><a id="cmid_' + user + '" style="color: #ff4081" href="javascript:;" class="cm-view-btn" onclick="getUser(\'' + user + '\')">爆他菊花</a></td></tr>';
    return str;
}

function getUser(user) {
    var el = document.querySelectorAll('#cmid_' + user);
    for (var i = 0; i < el.length; i++) {
        el[i].style = 'color: #3e3e3e';
        el[i].innerHTML = '正在解析';
    }

    var request = new XMLHttpRequest();
    request.open('GET', apiBase+'user/hash/' + user, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);
            if (data.error == 0) {
                var uid = data.data[0].id;

                window['displayName_' + uid] = function(names1) {
                    var name = names1.card.name;
                    for (var i = 0; i < el.length; i++) {
                        el[i].onclick = function() {};
                        el[i].setAttribute('target', '_blank');
                        el[i].style = '';
                        el[i].href = 'http://space.bilibili.com/' + uid;
                        el[i].innerHTML = name;
                    }
                }

                var script = document.createElement('script');
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('charset', 'utf-8');
                script.setAttribute('src', 'https://account.bilibili.com/api/member/getCardByMid?mid=' + uid + '&type=jsonp&callback=displayName_' + uid);
                document.body.appendChild(script);

            } else {
                alert("用户不存在，这条弹幕是非会员弹幕，也可能是此用户被徐特首删了");
                for (var i = 0; i < el.length; i++) {
                    el[i].innerHTML = '用户不存在';
                    el[i].onclick = 'javascript:void(0);';
                    el[i].href = 'javascript:void(0);';
                }
            }
        } else {
            alert("读取用户失败，服务器错误");
            for (var i = 0; i < el.length; i++) {
                el[i].innerHTML = '解析失败';
            }
        }
    };

    request.onerror = function() {
        alert("读取用户失败，网络错误");
        el.innerHTML = '网络错误';
    };

    request.send();
}

function getComment2(cid) {
  var request = new XMLHttpRequest();
  request.open('GET', 'https://bilibili.zscself.com/comment/' + cid + '.xml', true);
  // request.open('GET', 'https://comment.bilibili.com/' + cid + '.xml', true);

  show('loader2');
  disable("getComment2");

  request.onload = function() {
    hide('loader2');
    if (request.status >= 200 && request.status < 400) {
      disable('vurl2');
      var oParser = new DOMParser();
      var oDOM = oParser.parseFromString(request.responseText, "text/xml");
      window.commentElements2 = oDOM.getElementsByTagName("d");
      show('step2.2');
    } else {
      enable("getComment2");
      $("#vurl1").value = "comment2 onload 读取弹幕失败";
    }
  };

    request.onerror = function() {
        enable("getComment2");
        hide('loader2');
        $("#vurl1").value = "comment2 onerror 读取弹幕失败";
    };

    request.send();
}

bind("#frm-vurl2", "submit", function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    var re = /\/video\/av(\d+)(\/index.html|\/index_(\d+).html)?/;
    var str = $("#vurl2").value;
    var arr = str.match(re);
    if (!arr || !arr[1]) {
        $("#vurl2").value = "无效的视频地址";
        return false;
    }
    var aid = arr[1];
    var pid = arr[3] || 1;
    var request = new XMLHttpRequest();
    request.open('GET', apiBase + 'cid/' + aid + '/' + pid, true);

    disable("getComment2");
    show('loader2');

    request.onload = function() {
        enable("getComment2");
        hide('loader2');
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);
            if (data.error == 0) {
                getComment2(data.cid);
            } else {
                $("#vurl2").value = "请求错误";
            }
        } else {
            $("#vurl2").value = "服务器错误";
        }
    };

    request.onerror = function() {
        enable("getComment2");
        hide('loader2');
        $("#vurl2").value = "服务器错误";
    };

    request.send();
    return false;
});

bind("#frm-searchus", "submit", function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    var user = $("#ussearch").value;
    if (!user) {
        return false;
    }

    disable("searchUser");
    show('loader2');
    var html1 = '';

    window['finduser'] = function(data) {
        data = data.cards[user];
        if (data === null) {
            $("#ussearch").value = "未找到此用户";
            hide('loader2');
            enable("searchUser");
            return false;
        }
        var mid = data.mid;
        var request = new XMLHttpRequest();
        request.open('GET', apiBase+'userid/' + mid, true);

        request.onload = function() {
            enable("searchUser");
            hide('loader2');
            if (request.status >= 200 && request.status < 400) {
                show('step2.3');
                var data2 = JSON.parse(request.responseText);
                if (data2.error == 0) {
                    var crc = data2.data;
                    for (var i = 0; i < commentElements2.length; i++) {
                        var n = commentElements2[i].getAttribute('p').split(',')[6];
                        if (n && n.indexOf(crc) > -1) {
                            html1 += cm_tmpl2(commentElements2[i]);
                        }
                    }
                    if (!html1 || html1.length < 1) {
                        html1 = '<tr><td>没有找到任何弹幕，请尝试变更用户</td></tr>';
                    }
                    $('#cmList2').innerHTML = html1;
                } else {
                    $("#ussearch").value = "读取用户失败，请求错误";
                }
            } else {
                $("#ussearch").value = "读取用户失败，服务器错误";
            }
        };

        request.onerror = function() {
            alert("读取用户失败，网络错误")
        };

        request.send();
    }

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('charset', 'utf-8');
    script.setAttribute('src', 'https://account.bilibili.com/api/member/GetInfoByName?uname=' + user + '&type=jsonp&callback=finduser');
    document.body.appendChild(script);

    return false;
});

function cm_tmpl2(xmlnode) {
    var text = xmlnode.childNodes[0].nodeValue.replace(/"/g, "&quot;");
    var shorttext = text;
    if (text.length > 20) {
        shorttext = text.substr(0, 20);
    }
    var pdata = xmlnode.getAttribute('p').split(',');
    var time = parseInt(pdata[0]);

    var minutes = parseInt(time / 60);
    var minutesa = minutes.toString();
    minuteslength = minutesa.length;
    if (minuteslength <= 1) {
        minutesa = '0' + minutesa;
    }
    var seconds = time % 60;
    var secondsa = seconds.toString();
    secondslength = secondsa.length;
    if (secondslength <= 1) {
        secondsa = '0' + secondsa;
    }

    var str = '<tr><td class="mdl-data-table__cell--non-numeric" title="' + text + '">' + shorttext + '</td>\
                 <td>' + minutesa + ':' + secondsa + '</td></tr>';
    return str;
}
