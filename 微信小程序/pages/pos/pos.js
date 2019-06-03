Page({
  data: {
    height: 0,
    longitude: 0,
    latitude: 0,    
    markers: [],
    posTimer: null,
    timeGap: 10000
  },

  onLoad: function (options) {
    const _this = this;

    // 获取系统高度，设置地图尺寸
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          height: res.windowHeight
        })
      },
    });

    // 获取当前定位
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        _this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
      }
    });

    // 读取缓存中的配置文件
    wx.getStorage({
      key: 'config',
      success(res) {
        const data = res.data;

        _this.setData({
          outdoorTimeGap: Number(data.outdoorTimeGap) * 1000
        });
      },
      fail(res) {
        console.warn('配置文件读取失败!');
      }
    });
  },

  onReady: function () {
    let _this = this;

    // 获取地图坐标点
    wx.request({
      url: 'https://clvsit.utools.club/pos/get_position',
      method: 'GET',
      success(resp) {
        const res = resp.data;

        if (Number(res.code) == 1) {
          let markers = [],
            data = res.data;

          for (let i = 0, len = data.length; i < len; i++) {
            markers.push({
              iconPath: '/assets/icons/icon_point.png',
              id: data[0].lid,
              latitude: data[0].latitude,
              longitude: data[0].longitude,
              label: {
                content: data[0].name
              },
              width: 19,
              height: 24
            });
          }
          _this.setData({
            markers: markers
          })
        } else {
          wx.showToast({
            title: resp.msg,
          });
        }
      },
      fail(error) {
        console.log(error);
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let isGoIndoor = true,
      _this = this;

    const timer = setInterval(function () {
      wx.getLocation({
        type: 'gcj02',
        success: function (res) {
          console.log(res);
          wx.request({
            url: 'https://clvsit.utools.club/pos/judge_position',
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
              longitude: res.longitude,
              latitude: res.latitude
            },
            success(resp) {
              const res = resp.data;
              console.log(res);
              if (Number(res.code) == 1 && isGoIndoor) {
                isGoIndoor = false;
                wx.showModal({
                  title: '提示',
                  content: '检测到您已接近' + res.data.name + '，是否要切换到室内地图',
                  confirmText: '进入',
                  cancelText: '取消',
                  success(resp) {
                    if (resp.confirm) {
                      wx.navigateTo({
                        url: '/pages/indoor/indoor?lid=' + res.data.lid,
                      })
                    }
                  }
                });
              } else {
                isGoIndoor = true;
              }
            },
            fail(error) {
              console.warn(error);
            }
          })
        },
      })
    }, _this.data.timeGap);

    this.setData({
      posTimer: timer
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(this.data.posTimer);
    this.setData({
      posTimer: null
    });
  }
})