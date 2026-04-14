from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction

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