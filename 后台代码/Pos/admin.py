from django.contrib import admin
from .models import Location, AP, Signal, Apoint


admin.site.register(Location)
admin.site.register(AP)
admin.site.register(Signal)
admin.site.register(Apoint)