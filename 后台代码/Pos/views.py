import json
from django.http import HttpResponse
from django.db.utils import IntegrityError
from django.views.decorators.csrf import csrf_exempt

from Pos.utils import *
from .models import Signal, Location, AP, Apoint


@csrf_exempt
def get_position(request):
    if request.method == 'GET':
        location_list = Location.objects.all()
        return_location_list = []
        for location_info in location_list:
            return_location_list.append({
                'lid': location_info.lid,
                'name': location_info.name,
                'longitude': location_info.longitude,
                'latitude': location_info.latitude
            })
        resp = {'code': 1, 'msg': '获取坐标点成功!', 'data': return_location_list}
        return HttpResponse(json.dumps(resp), content_type="application/json")


@csrf_exempt
def judge_position(request):
    if request.method == 'POST':
        longitude = float(request.POST['longitude'])
        latitude = float(request.POST['latitude'])
        location_list = Location.objects.all()
        print(longitude, latitude)
        for location_info in location_list:
            longitude_info, latitude_info = float(location_info.longitude), float(location_info.latitude)
            print(longitude_info, latitude_info)
            dist = np.sqrt((longitude - longitude_info)**2 + (latitude - latitude_info)**2)
            print(dist)
            if dist < 1e-4:
                return HttpResponse(json.dumps({
                    'code': 1,
                    'msg': '',
                    'data': {'name': location_info.name, 'lid': location_info.lid}}
                ))
        return HttpResponse(json.dumps({
            'code': 0,
            'msg': ''
        }))


@csrf_exempt
def get_indoor(request):
    if request.method == 'GET':
        id_l = int(request.GET['lid'])

        location_info = Location.objects.filter(lid=id_l)[0]
        picture = '/static/images/' + location_info.picture

        point_list = Apoint.objects.filter(lid_id=id_l)
        returned_point_list = []

        for point in point_list:
            returned_point_list.append({
                'apid': point.apid,
                'top': point.top,
                'left': point.left
            })
        return HttpResponse(json.dumps({
            'code': 1,
            'msg': '获取室内数据成功!',
            'data': {
                'point': returned_point_list,
                'picture': picture
            }
        }))


@csrf_exempt
def sample(request):
    if request.method == 'POST':
        id_l = int(request.POST['lid'])
        id_ap = int(request.POST['apid'])
        ap_dict = signalStr2dict(request.POST['data'], method='sample')

        location = Location(lid=id_l)
        query_set = []
        try:
            for ap in ap_dict:
                signal_data_list = ap_dict[ap]
                for signal_data in signal_data_list:
                    query_set.append(Signal(lid=location, apid=id_ap, bssid=ap, strength=signal_data))
            Signal.objects.bulk_create(query_set)
        except:
            return HttpResponse(json.dumps({'code': 0, 'msg': '上传数据失败！'}))

        return HttpResponse(json.dumps({'code': 1, 'msg': '上传数据成功！'}))


@csrf_exempt
def train(request):
    if request.method == 'POST':
        id_l = int(request.POST['lid'])
        ap_count = int(request.POST['apCountPerGroup'])
        signal_data = Signal.objects.filter(lid_id=id_l)
        dataset = []
        for data in signal_data:
            dataset.append([data.bssid, data.strength, data.apid])

        # 数据清洗与转换
        ap_data, data_count = drop_signal_data(dataset)
        dataset_washed, feature_dict = record2trainSet(ap_data, data_count)
        x_washed, y_washed = dataset_washed[:, :-1], dataset_washed[:, -1]

        # 特征选择
        best_features, x_new = choose_best_feature(x_washed, y_washed, ap_count, feature_dict)
        best_features_str = ""
        for feature in best_features:
            best_features_str += feature + "|"
        best_features_str = best_features_str[:-1]

        # 模型训练以及持久化
        model_file = model_fit(x_new, y_washed, id_l)

        # 判断模型是否存在
        model_list = AP.objects.filter(lid=Location(1))
        if len(model_list) == 0:
            AP.objects.create(lid=Location(1), ap=best_features_str, model=model_file)
        else:
            model_obj = model_list[0]
            model_obj.model = model_file
            model_obj.save()
        return HttpResponse(json.dumps({'code': 1, 'msg': '训练完成'}))


@csrf_exempt
def predict(request):
    if request.method == 'POST':
        id_l = int(request.POST['lid'])
        ap_dict = signalStr2dict(request.POST['data'], method='predict')
        ap_records = AP.objects.filter(lid_id=id_l)
        model_list = []
        for ap_object in ap_records:
            model_list.append({'model_file': ap_object.model, 'ap': ap_object.ap.split('|')})

        result = []
        predict_data = []
        for model_dict in model_list:
            model_ap = model_dict['ap']
            for ap in model_ap:
                predict_data.append(ap_dict[ap])

            # 判断数据是否完整
            if len(predict_data) == len(model_ap):
                result = model_predict(predict_data, model_dict['model_file'])
                break

        print(result[0])
        return HttpResponse(json.dumps({'code': 1, 'msg': '预测成功!', 'data': result[0]}))


