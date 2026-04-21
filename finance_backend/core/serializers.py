from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction, CryptoHolding, CryptoTransaction

class RegisterSerializer(serializers.Serializer):  
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'description', 'category', 'transaction_type', 'date']
        read_only_fields = ['user', 'date']

class CryptoHoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoHolding
        fields = ['id', 'symbol', 'amount', 'invested_usd']

class CryptoTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoTransaction
        fields = ['id', 'symbol', 'amount_coin', 'price_usd', 'cost_kzt', 'trade_type', 'date']

class UserProfileSerializer(serializers.Serializer):
    xp = serializers.IntegerField()
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    rank = serializers.CharField(source='get_rank')