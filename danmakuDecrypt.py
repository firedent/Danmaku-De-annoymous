#!/usr/bin/env python3
#Modified by SuperFashi

import sys
import gzip
import json
import hashlib
import re
import urllib.parse
import urllib.request
import xml.dom.minidom as minidom
import zlib
import random

USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36'
APPKEY = '85eb6835b0a1034e'
APPSEC = '2ad42749773c441109bdc0191257a664'

def GetBilibiliUrl(url, findstr):
    regex_match = re.findall('http:/*[^/]+/video/av(\\d+)(/|/index.html|/index_(\\d+).html)?(\\?|#|$)',url)
    if not regex_match:
        return 'error2'
    aid = regex_match[0][0]
    pid = regex_match[0][2] or '1'

    cid_args = {'type': 'json', 'id': aid, 'page': pid}
    resp_cid = urlfetch('http://api.bilibili.com/view?'+GetSign(cid_args,APPKEY,APPSEC))
    resp_cid = dict(json.loads(resp_cid.decode('utf-8', 'replace')))
    cid = resp_cid.get('cid')

    resp_media = urlfetch('http://comment.bilibili.com/'+str(cid)+'.xml')
    dom = minidom.parseString(resp_media.decode('utf-8', 'replace'))
    inside = dom.getElementsByTagName("i")[0]
    chats = inside.getElementsByTagName("d")
    for chat in chats:
        if chat.childNodes[0].nodeValue.find(findstr)<0:
            continue
        dialogue = chat.childNodes[0].nodeValue
        timesec = float(chat.attributes["p"].value.split(',')[0])
        timesecaf = int(timesec) % 60
        timemin = int((int(timesec) - timesecaf) / 60)
        if len(str(timesecaf)) < 2:
            timesecaf = "0" + str(timesecaf)
        if len(str(timemin)) < 2:
            timemin = "0" + str(timemin)
        gethash = urlfetch('http://biliquery.typcn.com/api/user/hash/'+chat.attributes["p"].value.split(',')[6].lower())
        accu = dict(json.loads(gethash.decode('utf-8', 'replace')))
        iserror = accu.get('error')
        if iserror != 1:
            mid = accu.get('data')
            mid = mid[0]
            mid = mid.get('id')
        else:
            print('Not Found!')
            continue
        name = dict(json.loads(urlfetch('http://api.bilibili.com/userinfo?mid='+str(mid)).decode('utf-8', 'replace'))).get('name')
        print(name+'  '+str(mid)+'  '+dialogue+'  '+str(timemin)+':'+str(timesecaf))
    return
    
def GetSign(params,appkey,AppSecret=None):
    params['appkey']=appkey;
    data = "";
    paras = sorted(params)
    paras.sort();
    for para in paras:
        if data != "":
            data += "&";
        data += para + "=" + str(params[para]);
    if AppSecret == None:
        return data
    m = hashlib.md5()
    m.update((data+AppSecret).encode('utf-8'))
    return data+'&sign='+m.hexdigest()
    
def urlfetch(url):
    ip = random.randint(1,255)
    select = random.randint(1,2)
    if select == 1:
        ip = '220.181.111.' + str(ip)
    else:
        ip = '59.152.193.' + str(ip)
    req_headers = {'Accept-Encoding': 'gzip, deflate', 'User-Agent': USER_AGENT, 'Client-IP': ip, 'X-Forwarded-For': ip, 'Cookie': 'DedeUserID=8926815; DedeUserID__ckMd5=7a15e38c8988dd51; SESSDATA=f3723f8c%2C1445522963%2Ce07d220f;'}
    req = urllib.request.Request(url=url, headers=req_headers)
    response = urllib.request.urlopen(req, timeout=120)
    content_encoding = response.info().get('Content-Encoding')
    if content_encoding == 'gzip':
        data = gzip.GzipFile(fileobj=response).read()
    elif content_encoding == 'deflate':
        decompressobj = zlib.decompressobj(-zlib.MAX_WBITS)
        data = decompressobj.decompress(response.read())+decompressobj.flush()
    else:
        data = response.read()
    return data

if __name__ == '__main__':
    if len(sys.argv) == 1:
        print('输入视频播放地址')
        exit()
    if len(sys.argv) == 2:
        print('输入要查找的字符')
        exit()
    media_urls = GetBilibiliUrl(sys.argv[1], sys.argv[2])
