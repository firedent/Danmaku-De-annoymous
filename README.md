# Danmaku-De-annoymous
A simple webpage to dig out some Keyboard Man
##说明
是不是已经厌烦了满屏一样的弹幕，让我们来看一看到底是哪些人总是再刷同一条弹幕。筛选发同一条弹幕两条以上的用户，只发一遍的不会显示。
Dev分支为本人小幅修改后的代码，Master为原版代码，原版链接（404）：<https://gitlab.com/FuckBilibili/Danmaku-De-annoymous>
## Fancy, but how does it works?
Let me try to put this in human language.

Every article of Bilibili would be assigned an unique aid: this is the so-called "av number".

There can be 1 or more pages under one aid. For every content(most of the times are videos) in this page, a unique content ID, cid is assigned.

By calling the view API, we can retrieve the cid with aid: should there exists more pages, a page should be attached to specific one particular content.

The hash is generated as: (all the example code comes from Biligrab)
```
def calc_sign(string):
    """str/any->str
    return MD5."""
    return str(hashlib.md5(str(string).encode('utf-8')).hexdigest())
```

The complete API call looks like:

```
str2Hash = 'appkey={APPKEY}&id={vid}&page={p}&type=xml{SECRETKEY}'.format(APPKEY = APPKEY, vid = vid, p = p, SECRETKEY = SECRETKEY)
biliurl = 'https://api.bilibili.com/view?appkey={APPKEY}&id={vid}&page={p}&type=xml&sign={sign}'.format(APPKEY = APPKEY, vid = vid, SECRETKEY = SECRETKEY, p = p, sign = calc_sign(str2Hash))
```

The sample response is:

```
<?xml version="1.0" encoding="UTF-8"?>
<info>
    Blahblah...  
  <cid>4802847</cid>
  blahblah
</info>
```

The view API is also available with JSONP output.

The danmaku file is available at ```http://comment.bilibili.com/{cid}.xml```. In this case I do not count historical comments.

The format of a particular line of danmaku looks like:
```
<d p="12.456999778748,1,25,16777215,1444811244,0,550e9706,1278188533">第二</d>
```

in human language:

```
<d p="time,mode,fontsize,colour,timestamp,danmaku-pool,CRC32-of-User-ID,danmaku-ID">content</d>
```

It is possible to run a brute-force decrypt of CRC32; or, the preferred way is a small rainbow table with cache, which would significantly reduce the server load.

The user ID is called mid.

The user space is available at ```http://space.bilibili.com/{mid}```.

Jackpot.
