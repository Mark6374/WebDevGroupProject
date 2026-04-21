from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', views.register),
    path('login/', TokenObtainPairView.as_view()),
    path('summary/', views.user_summary),
    path('transactions/', views.TransactionListCreate.as_view()),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view()),
    path('categories/', views.CategoryList.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('crypto/buy/', views.buy_crypto),
    path('crypto/wallet/', views.CryptoWalletView.as_view()),
    path('crypto/sell/', views.sell_crypto),
    path('topup/', views.topup_balance),
    path('categories/<int:pk>/', views.CategoryDetail.as_view()),
]