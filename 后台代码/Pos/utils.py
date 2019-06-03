import numpy as np
from sklearn.feature_selection import SelectKBest
from sklearn.feature_selection import chi2
from sklearn.neighbors import KNeighborsClassifier
from sklearn.externals.joblib import dump, load


def signalStr2dict(data_str, method='sample'):
    """
    将信号强度字符串转换成字典形式
    """
    data_split = data_str.split("|")
    ap_dict = {}
    for data in data_split:
        ap_bssid, ap_strength = data.split(",")
        if ap_bssid not in ap_dict:
            ap_dict[ap_bssid] = []
        if method == 'sample':
            ap_dict[ap_bssid].append(int(ap_strength))
        else:
            ap_dict[ap_bssid] = int(ap_strength)
    return ap_dict


def drop_signal_data(dataset):
    ap_dict = {}
    for data in dataset:
        bssid = data[0]
        if bssid not in ap_dict:
            ap_dict[bssid] = []
        ap_dict[bssid].append((data[1], data[2]))

    ap_count_list = []
    for ap in ap_dict:
        ap_count_list.append(len(ap_dict[ap]))
    data_count = np.max(ap_count_list)

    ap_result = {}
    for ap in ap_dict:
        if len(ap_dict[ap]) == data_count:
            ap_result[ap] = ap_dict[ap]
    return ap_result, data_count


def record2trainSet(ap_data, data_count):
    matrix = np.zeros((data_count, len(ap_data) + 1))
    ind, feature_dict = 0, {}
    for ap in ap_data:
        feature_dict[ind] = ap
        if ind == 0:
            matrix[:, -1] = [data[1] for data in ap_data[ap]]
        matrix[:, ind] = [data[0] for data in ap_data[ap]]
        ind += 1
    return matrix, feature_dict


def choose_best_feature(x, y, k, feature_dict):
    """
    特征选择，选择最佳的 k 个特征
    :param x:
    :param y:
    :param k:
    :param feature_dict:
    :return:
    """
    sk_model = SelectKBest(score_func=chi2, k=5)
    sk_model.fit(x, y)
    feature_list, ind_list = [], sk_model.get_support(True)

    for ind in ind_list:
        feature_list.append(feature_dict[ind])
    return feature_list, sk_model.transform(x)


def model_fit(x, y, lid):
    """
    模型训练
    :param x:
    :param y:
    :param: lid:
    :return:
    """
    model = KNeighborsClassifier()
    model.fit(x, y)
    model_file = "model_" + str(lid) + ".sav"
    with open(model_file, 'wb') as model_f:
        dump(model, model_f)
    return model_file


def model_predict(x, model_file):
    """
    模型预测
    :param x: 待预测数据
    :param model_file: 模型文件名
    :return:
    """
    with open(model_file, 'rb') as model_f:
        model = load(model_f)
        return model.predict([x])