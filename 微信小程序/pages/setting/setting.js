// pages/setting/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    outdoorTimeGap: 10,
    indoorTimeGap: 5,
    sampleTimeGap: 5,
    sampleTimes: 5,
    apGroups: 2,
    apCountPerGroup: 5
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;

    // 获取缓存在本地的配置内容
    wx.getStorage({
      key: 'config',
      success(res) {
        const data = res.data;
        console.log(data);
        _this.setData({
          indoorTimeGap: data.indoorTimeGap,
          outdoorTimeGap: data.outdoorTimeGap,
          sampleTimeGap: data.sampleTimeGap,
          sampleTimes: data.sampleTimes,
          apGroups: data.apGroups,
          apCountPerGroup: data.apCountPerGroup
        })    
      },
      fail(res) {
        wx.setStorage({
          key: 'config',
          data: {
            "outdoorTimeGap": 10,
            "indoorTimeGap": 5,
            "sampleTimeGap": 5,
            "sampleTimes": 5,
            "apGroups": 2,
            "apCountPerGroup": 5
          },
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 修改配置信息，并添加到本地缓存中
   */
  setConfig: function (event) {
    console.log(event);
    try {
      let config = wx.getStorageSync("config"),
        type = event.currentTarget.dataset.type;
      console.log(type);
      switch (type) {
        case "indoorTimeGap": {
          config.indoorTimeGap = Number(event.detail.value);
          break;
        }
        case "outdoorTimeGap": {
          config.outdoorTimeGap = Number(event.detail.value);
          break;
        }
        case "sampleTimeGap": {
          config.sampleTimeGap = Number(event.detail.value);
          break;
        }
        case "sampleTimes": {
          config.sampleTimes = Number(event.detail.value);
          break;
        }
        case "apGroups": {
          config.apGroups = Number(event.detail.value);
          break;
        }
        case "apCountPerGroup": {
          config.apCountPerGroup = Number(event.detail.value);
          break;
        }
      }
      wx.setStorageSync("config", config);
    } catch (e) {
      console.error(e);
    }
  }
})