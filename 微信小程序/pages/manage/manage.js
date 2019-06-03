Page({
  data: {
    height: 0,
    points: [],
    message: {
      point: '未选择',
      train: '暂无训练信息',
      predict: '暂无预测结果'
    },
    config: {
      apGroups: 2,
      apCountPerGroup: 5,
      sampleTimes: 5000,
      sampleTimeGap: 5000
    },
    signalStr: "",
    lid: 1,
    apid: 0
  },

  onLoad: function (options) {
    const _this = this;

    // 设置 indoor 传递的 lid 参数
    this.setData({
      lid: options.lid
      // 测试使用
      // lid: 1
    });

    // 获取系统高度信息
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          height: res.windowHeight - 480
        })
      }
    });

    // 读取配置文件内容
    wx.getStorage({
      key: 'config',
      success(res) {
        const data = res.data;

        _this.setData({
          "config.apGroups": Number(data.apGroups),
          "config.apCountPerGroup": Number(data.apCountPerGroup),
          "config.sampleTimes": Number(data.sampleTimes),
          "config.sampleTimeGap": Number(data.sampleTimeGap) * 1000
        });
      },
      fail(res) {
        console.warn('配置文件读取失败!');
      }
    });

    // 监听 Wifi 列表
    wx.onGetWifiList(function (msg) {
      let wifiList = msg.wifiList,
        wifiSignalStr = _this.data.signalStr,
        i = 0;

      for (let len = wifiList.length; i < len; i++) {
        wifiSignalStr += wifiList[i].BSSID + "," + wifiList[i].signalStrength + "|";
      }
      console.log(wifiSignalStr);
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
            points: res.data.point
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

  },

  onHide: function () {

  },

  onUnload: function () {

  },

  /**
   * 获取指定指纹 AP 坐标点
   */
  getPoint: function (event) {
    const pointInd = event.target.dataset.point;

    this.setData({
      "message.point": pointInd,
      apid: pointInd
    });
  },

  /**
   * 采集指定 AP 点信号强度数据
   */
  sample: function () {
    const _this = this;

    if (this.data.apid == 0) {
      wx.showToast({
        icon: 'none',
        title: '请选择坐标点',
        mask: true
      });
    } else {
      wx.startWifi({
        success(res) {
          let loop = 0;

          wx.showLoading({
            title: '开始采样数据',
            mask: true
          });

          const timer = setInterval(function () {
            loop += 1
            wx.getWifiList({
              success: function (wifi_list) {
                if (loop == _this.data.config.sampleTimes + 1) {
                  clearTimeout(timer);
                  wx.hideLoading();
                  wx.showLoading({
                    title: '上传采样数据'
                  });

                  // 获取完毕后，向后台发起请求
                  wx.request({
                    method: 'POST',
                    url: 'https://clvsit.utools.club/pos/sample',
                    header: {
                      'content-type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                      lid: _this.data.lid,
                      apid: _this.data.apid,
                      data: _this.data.signalStr.substr(0, _this.data.signalStr.length - 1)
                    },
                    success(resp) {
                      const res = resp.data;

                      wx.hideLoading();
                      wx.showToast({
                        icon: 'none',
                        title: res.msg,
                        mask: true
                      });
                      setTimeout(function () {
                        wx.hideToast();
                      }, 2000);
                    },
                    fail(error) {
                      wx.hideLoading();
                      console.warn(error);
                    },
                    complete() {
                      // 清空 signalStr
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
          }, _this.data.config.sampleTimeGap)
        }
      })
    }
  },

  /**
   * 对当前室内进行模型训练
   */
  train: function () {
    const _this = this;
    
    wx.showLoading({
      title: '开始训练',
    });
    wx.request({
      url: 'https://clvsit.utools.club/pos/train',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        lid: this.data.lid,
        apGroups: this.data.config.apGroups,
        apCountPerGroup: this.data.config.apCountPerGroup
      },
      success: function (resp) {
        const res = resp.data;

        if (Number(res.code) == 1) {
          _this.setData({
            "message.train": "训练成功!"
          });
        }
        wx.hideLoading();
        wx.showToast({
          title: res.msg,
          mask: true
        });
        setTimeout(function () {
          wx.hideToast();
        }, 2000);
      },
      fail: function (error) {
        wx.hideLoading();
        console.warn(error);
      }
    })
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

        wx.showLoading({
          title: '开始预测',
          mask: true
        });

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
                  success (resp) {
                    const res = resp.data;

                    wx.hideLoading();
                    if (Number(res.code) == 1) {
                      wx.showToast({
                        title: res.msg,
                        mask: true
                      });
                      _this.setData({
                        "message.predict": res.data
                      });
                    } else {
                      wx.showToast({
                        icon: 'none',
                        title: res.msg,
                        mask: true
                      });
                    }
                    setTimeout(function () {
                      wx.hideToast();
                    }, 2000);             
                  },
                  fail (error) {
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
        }, 2000)
      },
    })
  }
})