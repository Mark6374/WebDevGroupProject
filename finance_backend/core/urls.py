from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', views.register),
    path('login/', TokenObtainPairView.as_view()),
    path('summary/', views.user_summary),
    path('transactions/', views.TransactionListCreate.as_view()),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view()),
    path('categories/', views.CategoryList.as_view()),
]