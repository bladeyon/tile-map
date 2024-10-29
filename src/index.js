// An highlighted block
let Bagpipe = require('bagpipe');
let fs = require('fs');
let request = require('request');
//下载范围
// let bouses = [[68.066, 0.9742, 155.165, 73.312]]; // 全国
let bouses = [
  [68.066, 0.9742, 155.165, 73.312]
  //   [82.2297, 43.324, 91.9793, 47.4974]
  //   [105.378, 34.5371, 111.2584, 40.378],
  //   [107.0032, 41.2081, 119.5295, 46.8235],
  //   [119.1816, 42.3326, 128.5299, 49.5446]
];

let minLevel = 4; //最小层级
let maxLevel = 8; //最大层级
//地图类型(img_w:影像底图 cia_w:影像标注 vec_w:街道底图 cva_w街道标注, ibo_w 矢量边界 查官网api找相对应的)
let zPath = ['cva', 'ibo']; // 每种类型瓦片放对应目录
let projection = 'w'; // 投影方式： w: 球面墨卡托投影; c: 经纬度投影
let speed = 10; //并发数

const keys = [
  //天地图key有每日访问限制，不够的话可以再弄几个
  'badb8533f40a85113b57ccba926fceff',
  '1ea952a9eb216d64108b667aa33f9b78',
  '5e2932cacdcd4a54d9247c33bae97f7f',
  'd3108ee2841c1d8b1409f5be463c0dbe',
  '94c7616ba5b7f64e1be5acea360c8c83'
];

let time = Date.now();
let token = keys[time % 5]; //key的每日使用次数有限，几个换着用
const ApiIndex = time % 8; //天地图 t0-t7都可用,但频繁使用其中一个,会报418访问变慢

let all = [];
let user_agent_list_2 = [
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36 OPR/26.0.1656.60',
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
  'Mozilla/5.0 (X11; U; Linux x86_64; zh-CN; rv:1.9.2.10) Gecko/20100922 Ubuntu/10.10 (maverick) Firefox/3.6.10',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
  'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Chrome/10.0.648.133 Safari/534.16',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.11 TaoBrowser/2.0 Safari/536.11',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.71 Safari/537.1 LBBROWSER',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; LBBROWSER)',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E; LBBROWSER)',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E)',
  'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.84 Safari/535.11 SE 2.X MetaSr 1.0',
  'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; SV1; QQDownload 732; .NET4.0C; .NET4.0E; SE 2.X MetaSr 1.0)',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Maxthon/4.4.3.4000 Chrome/30.0.1599.101 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 UBrowser/4.0.3214.0 Safari/537.36'
];

for (const bou of bouses) {
  computeXYForLevel(bou, minLevel, maxLevel);
}
/**
 * 计算经纬度转换成瓦片坐标
 * @param {Number} lng 经度
 * @param {Number} lat 纬度
 * @param {Number} level 层级
 */
function calcXY(lng, lat, level) {
  let x = (lng + 180) / 360;
  let title_X = Math.floor(x * Math.pow(2, level));
  let lat_rad = (lat * Math.PI) / 180;
  let y =
    (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2;
  let title_Y = Math.floor(y * Math.pow(2, level));
  return { title_X, title_Y };
}

/**
 * 计算每个层级的瓦片坐标
 * @param {Arr} bounding 范围
 * @param {Number} minLevel 最小层级
 * @param {Number} maxLevel 最大层级
 */
function computeXYForLevel(bounding, minLevel, maxLevel) {
  for (i = minLevel; i <= maxLevel; i++) {
    const item = {};
    let p1 = calcXY(bounding[2], bounding[3], i);
    let p2 = calcXY(bounding[0], bounding[1], i);
    item.t = i; // 层级
    item.x = [p2.title_X, p1.title_X]; // 瓦片横坐标范围（左至右）
    item.y = [p1.title_Y, p2.title_Y]; // 瓦片纵坐标范围（下至上）
    all.push(item);
  }
  let sum = 0;
  for (let z = 0; z <= all.length - 1; z++) {
    for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
      for (let y = all[z].y[0]; y <= all[z].y[1]; y++) {
        // 将下载任务推入队列
        ++sum;
      }
    }
  }
  // console.log("瓦片编号范围：", all);
  console.log('下载总数：', sum * zPath.length);
  for (let index = 0; index < zPath.length; index++) {
    createDir(zPath[index]);
  }
}

function createDir(zPath) {
  fs.access(zPath, fs.constants.F_OK, (err) => {
    // 创建tiles文件夹
    if (err) fs.mkdir(zPath, (err) => {});
    for (let z = 0; z <= all.length - 1; z++) {
      const path = `../${zPath}/${all[z].t}`;
      fs.access(path, fs.constants.F_OK, (err) => {
        // 创建tiles/Z文件夹 ,Z是层级
        if (err) fs.mkdir(`${path}`, (err) => {});
        for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
          fs.access(`${path}/${x}`, fs.constants.F_OK, (err) => {
            // 创建tiles/Z/X文件夹 ,X是瓦片横坐标
            if (err) fs.mkdir(`${path}/${x}`, (err) => {});
          });
        }
      });
    }
    // 文件夹可能较多，等待2s开始下载
    setTimeout(() => {
      task(zPath);
    }, 2000);
  });
}

/**
 * 创建下载队列
 */

let sum = 0;
let bag = new Bagpipe(speed, { timeout: 1000 });
function task(zPath) {
  for (let z = 0; z <= all.length - 1; z++) {
    for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
      for (let y = all[z].y[0]; y <= all[z].y[1]; y++) {
        const filePath = `../${zPath}/${all[z].t}/${x}/${y}.png`;
        // 下载之前判断文件是否已经存在
        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (err) {
            // 将下载任务推入队列
            ++sum;
            bag.push(download, zPath, x, y, all[z].t);
          } else {
            console.log(filePath, '已存在');
          }
        });
      }
    }
  }
}

/**
 * 下载图片方法
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
function download(path, x, y, z) {
  let ts = Math.floor(Math.random() * 8); //随机生成0-7台服务器
  // let imgurl = `http://t${ts}.tianditu.gov.cn/DataServer?T=${mapStyle}&x=${x}&y=${y}&l=${z}&tk=${token}`;
  let imgurl = `http://t${ts}.tianditu.gov.cn/${path}_${projection}/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${path}&STYLE=default&TILEMATRIXSET=${projection}&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${token}`;
  let ip =
    Math.floor(Math.random() * 256) + //随机生成IP迷惑服务器
    '.' +
    Math.floor(Math.random() * 256) +
    '.' +
    Math.floor(Math.random() * 256) +
    '.' +
    Math.floor(Math.random() * 256);
  let v = Math.floor(Math.random() * 9);
  let options = {
    method: 'GET',
    url: imgurl,
    headers: {
      'User-Agent': user_agent_list_2[v],
      'X-Forwarded-For': ip,
      Connection: 'keep-alive'
    },
    timeout: 5000,
    forever: true
  };

  request(options, (err, res, body) => {
    if (err) {
      bag.push(download, x, y, z);
      console.log('request错误', err);
    }
  }).pipe(
    fs
      .createWriteStream(`../${path}/${z}/${x}/${y}.png`)
      .on('finish', () => {
        console.log(`图片下载成功,第${z}层`);
        console.log(--sum);
      })
      .on('error', (err) => {
        console.log('发生异常:', err);
      })
  );
}
