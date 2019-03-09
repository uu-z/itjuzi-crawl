import axios from "axios";
import _ from "lodash";
import * as randomstring from "randomstring";
import PQueue from "p-queue";
import ES from "elasticsearch";
import { EventEmitter } from "events";
const event = new EventEmitter();

const requsetQueue = new PQueue({ concurrency: 20 });

const es = new ES.Client({
  host: "localhost:9200",
  log: "trace"
});

const Cookie = `acw_tc=${randomstring.generate(62)}`;

const requset = async ({ page = 1, word = "不限" } = {}) => {
  try {
    const { data } = await axios({
      method: "GET",
      url: `https://www.itjuzi.com/api/search/index_search`,
      headers: {
        Cookie
      },
      data: {
        page,
        word
      }
    });

    _.each(data.data, (v, k) => {
      event.emit("data", {
        index: k,
        data: v.data
      });
    });
  } catch (e) {
    console.error(e && e.response && e.response.data);
  }
};

event.on("data", async ({ index, data }) => {
  await Promise.all(
    data.forEach(async i => {
      return es.create({
        index,
        type: "anime",
        id: i.id,
        body: i
      });
    })
  );
});

const reqByWord = ({ word }) => {
  _.range(0, 1000).forEach(i => {
    requsetQueue.add(() => requset({ page: i, word }));
  });
};

const main = async () => {
  [
    "教育",
    "金融",
    "汽车交通",
    "房产服务",
    "医疗健康",
    "旅游",
    "本地生活",
    "游戏",
    "广告营销",
    "硬件",
    "文娱传媒",
    "企业服务",
    "社交网络",
    "电子商务",
    "工具软件",
    "体育运动",
    "物流",
    "农业",
    "新工业",
    "其他"
  ].forEach(word => reqByWord({ word }));
};

main();
