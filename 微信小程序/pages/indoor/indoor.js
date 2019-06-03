const app = getApp();

Page({
  data: {
    height: 0,
    points: [],
    point: {
      top: 0,
      left: 0
    },
    isManager: true,    
    config: {
      indoorTimeGap: 5000
    },
    picture: '',
    timer: null,
    apid: 1,
    lid: 1
  },

  onLoad: function (options) {
    const _this = this;

    // 设置 pos 传递的 lid 参数
    this.setData({
      lid: options.lid
      // 测试使用
      // lid: 1
    });

    // 获取系统高度信息
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          height: res.windowHeight - 60,
        })
      },
    });

    // 读取配置文件内容
    wx.getStorage({
      key: 'config',
      success(res) {
        const data = res.data;

        _this.setData({
          "config.indoorTimeGap": Number(data.indoorTimeGap) * 1000                    
        });
      },
      fail(res) {
        console.warn('配置文件读取失败!');
      }
    });

    // console.log(app.globalData.userInfo);
    if (app.globalData.userInfo == '岁末的温染') {
      this.setData({
        isManager: true
      })
    }

    wx.onGetWifiList(function (msg) {
      let wifiList = msg.wifiList,
        wifiSignalStr = _this.data.signalStr,
        i = 0;

      for (let len = wifiList.length; i < len; i++) {
        wifiSignalStr += wifiList[i].BSSID + "," + wifiList[i].signalStrength + "|";
      }
      _this.setData({
        signalStr: wifiSignalStr
      });
    });
  },

  onReady: function () {
    const _this = this;

    // 获取 AP 坐标列表
    wx.request({
      url: 'https://clvsit.utools.club/pos/get_indoor',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        lid: _this.data.lid
      },
      success: function (resp) {
        const res = resp.data;

        if (Number(res.code) == 1) {
          _this.setData({
            points: res.data.point,
            picture: "https://clvsit.utools.club" + res.data.picture
          });
        } else {
          wx.showToast({
            title: res.msg,
          });
          setTimeout(function () {
            wx.hideToast();
          }, 2000);
        }
      },
      fail: function (error) {
        console.warn(error);
      }
    })
  },

  onShow: function () {
    const _this = this,
      timer = setInterval(function () {
        _this.predict();        
    }, _this.data.config.indoorTimeGap);

    _this.setData({
      timer: timer
    });
  },

  onHide: function () {
    clearInterval(this.data.timer);
    this.setData({
      timer: null
    });
  },

  onUnload: function () {

  },

  /**
   * 预测当前位置所属 AP 坐标点
   */
  predict: function () {
    const _this = this;
    
    wx.startWifi({
      success(res) {
        console.log(res.errMsg);
        let loop = 0;

        const timer = setInterval(function () {
          loop += 1
          wx.getWifiList({
            success: function (wifi_list) {
              if (loop == 2) {
                clearTimeout(timer);

                // 获取完毕后，向后台发起请求
                wx.request({
                  method: 'POST',
                  url: 'https://clvsit.utools.club/pos/predict',
                  header: {
                    'content-type': 'application/x-www-form-urlencoded'
                  },
                  data: {
                    lid: _this.data.lid,
                    data: _this.data.signalStr.substr(0, _this.data.signalStr.length - 1)
                  },
                  success(resp) {
                    const res = resp.data;

                    wx.hideLoading();
                    if (Number(res.code) == 1) {
                      const pointList = _this.data.points,
                        apid = Number(res.data);

                      for (let i = 0, len = pointList.length; i < len; i++) {
                        const point = pointList[i];

                        console.log(point, apid);
                        if (point.apid === apid) {
                          _this.setData({
                            "point.top": point.top,
                            "point.left": point.left
                          });
                          break;
                        }
                      }
                      console.log(res.data);
                    }
                  },
                  fail(error) {
                    wx.hideLoading();
                    console.warn(error);
                  },
                  complete() {
                    _this.setData({
                      signalStr: ""
                    });
                  }
                })
              }
            },
            fail: function (error) {
              console.warn(error);
            }
          })
        }, 1000)
      },
    })
  }
})