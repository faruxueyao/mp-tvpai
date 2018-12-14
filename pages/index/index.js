//index.js
var utils = require('../../utils/util.js');
var appJs = require('../../app.js');
var api = require('../../config/config.js');
var app = getApp()


Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: '1',
    pageSize: '10',
    banners: [],
    hasMoreData: true,
    streams: [],
    indicatorDots: true,
    autoplay: true,
    indicatorColor: '#ececec',
    indicatorActiveColor: '#acacac',
    interval: 5000,
    duration: 500
  },
  listenSwiper: function (e) {
    // console.log(e)
  },
  // 获取轮播图数据
  getBanners: function (message) {
    let that = this
    const url = api.getBannersUrl
    const key = app.globalData.key
    const sign = utils.encryption({}, key)
    let data = {
      client_id: app.globalData.client_id,
      sign: sign,
      param: {}
    }
    utils.postLoading(url, 'GET', data, function (res) {
      // success
      console.log('banners success:')
      console.log(res)

      if (res.data && res.data.data) {
        if (res.data.data.length > 5) {
          that.setData({
            banners: res.data.data.slice(0, 5)
          })
        } else {
          that.setData({
            banners: res.data.data
          })
        }
      }
    }, function (res) {
      // fail
      console.log('banners fail:')
      console.log(res)
      wx.showToast({
        title: '加载轮播数据失败',
      })
    }, function (res) {
      // complete
      console.log('banners complete:')
      console.log(res)
    }, message)
  },
  // 获取信息流
  getStreams: function (message) {
    let that = this
    const url = api.getStreamsUrl
    const key = app.globalData.key
    const page = that.data.page
    const pageSize = that.data.pageSize
    const params = { "page": page, "pageSize": pageSize }
    const sign = utils.encryption(params, key)

    let data = {
      client_id: app.globalData.client_id,
      sign: sign,
      param: params
    }
    utils.postLoading(url, 'GET', data, function (res) {
      console.log('streams ok:')
      console.log(res)

      let streamsTm = that.data.streams
      if (res.data.result) {
        if (that.data.page == '1') {
          streamsTm = []
        }
        if (parseInt(that.data.page) > res.data.data.pager.totalPage) {
          that.setData({
            hasMoreData: false
          })
          return false
        }
        let streams = res.data.data.list
        if (streams.length < parseInt(that.data.pageSize)) {
          that.setData({
            streams: getPeriods(streamsTm.concat(streams)),
            hasMoreData: false
          })
        } else {
          that.setData({
            streams: getPeriods(streamsTm.concat(streams)),
            hasMoreData: true,
            page: parseInt(that.data.page) + 1 + ''
          })
        }
      } else {
        wx.showToast({
          title: res.data.message,
        })
      }


    }, function (res) {
      console.log('streams fail:')
      console.log(res)

      wx.showToast({
        title: '加载数据失败',
      })
    }, function (res) {
      console.log('streams complete:')
      console.log(res)
    }, message)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    that.getBanners('加载中')
    that.getStreams('')
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
    var that = this
    var ccsession = wx.getStorageSync('cksession')
    // console.log("ccsession:")
    if (ccsession === null || ccsession === '') {
      //重新登录
      wx.login({
        success: function (e) {
          var code = e.code
          console.log("-----wx.login-----" + JSON.stringify(e));
          wx.getUserInfo({
            success: function (res) {
              var encryptedData = res.encryptedData
              var iv = res.iv;
              var rawData = res.rawData
              var signature = res.signature
              app.globalData.userInfo = res.userInfo
              wx.setStorageSync('userInfo', res.userInfo)
              typeof cb == "function" && cb(app.globalData.userInfo)
              appJs.login(rawData, code, encryptedData, iv, signature)
              that.setData({
                userInfo: res.userInfo
              })
            }, fail: function () {
              console.log("未获得用户信息")
            }
          })
        }
      })
    } else {
      app.getUserInfo();
      var userInfo = wx.getStorageSync('userInfo')
      if (typeof (userInfo) == "undefined") {
        console.log('get user info failed')
      } else {
        console.log('get user info success')
      }
      //更新数据
      that.setData({
        userInfo: userInfo,
        username: wx.getStorageSync("username")
      })

    }

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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.data.page = '1'
    this.getBanners('正在刷新数据')
    this.getStreams('正在刷新数据')
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMoreData) {
      this.getStreams('加载中')
    } else {

      this.setData({
        hasMoreData: false
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return {
      title: '酷影评',
      path: 'pages/index/index',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})
// 获取期数
function getPeriods(e) {
  let data = e, dl = data.length, firstTime = getMonthDay(data[0].createTime)
  data[0].createTime = firstTime
  for (let i = 1; i < dl; i++) {
    if (getMonthDay(data[i].createTime) == firstTime) {
      data[i].createTime = 'period'
    } else {
      firstTime = getMonthDay(data[i].createTime)
      data[i].createTime = firstTime
    }
  }

  return data
}

function getMonthDay(d) {
  var date = new Date(d);
  return ( date.getMonth() + 1 ) + '月' + date.getDate() + '日'
}
