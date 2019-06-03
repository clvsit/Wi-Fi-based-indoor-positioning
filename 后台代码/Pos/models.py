from django.db import models


class Location(models.Model):
    """
    地点表
    """
    lid = models.AutoField('地点编号', primary_key=True, max_length=5)
    name = models.CharField('地点名称', max_length=16, unique=True)
    longitude = models.CharField('经度', max_length=10)
    latitude = models.CharField('纬度', max_length=10)
    picture = models.CharField('结构图', max_length=16, default='1.jpg')

    def __str__(self):
        return self.name


class Apoint(models.Model):
    id = models.AutoField('指纹 AP 号', primary_key=True)
    lid = models.ForeignKey(Location, on_delete=models.CASCADE, default=0)
    apid = models.IntegerField('指纹 AP 编号')
    top = models.CharField('坐标-顶部', max_length=4)
    left = models.CharField('坐标-左侧', max_length=4)


class Signal(models.Model):
    """
    信号强度表
    """
    sid = models.AutoField('信号强度号', primary_key=True)
    lid = models.ForeignKey(Location, on_delete=models.CASCADE, default=0)
    apid = models.IntegerField('指纹 AP 编号')
    bssid = models.CharField('BSSID', max_length=17)
    strength = models.IntegerField('信号强度')


class AP(models.Model):
    id = models.AutoField('关联号', primary_key=True)
    lid = models.ForeignKey(Location, on_delete=models.CASCADE, default=0)
    ap = models.CharField('指纹 AP 组', max_length=256)
    model = models.CharField('学习模型', max_length=24, unique=True)