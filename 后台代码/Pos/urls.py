from django.urls import path
from . import views

urlpatterns = [
    path('get_position', views.get_position, name='get_position'),
    path('judge_position', views.judge_position, name='judge_position'),
    path('get_indoor', views.get_indoor, name='get_indoor'),
    path('sample', views.sample, name='sample'),
    path('train', views.train, name='train'),
    path('predict', views.predict, name='predict'),
]
