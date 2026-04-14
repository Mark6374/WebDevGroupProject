from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth.models import User
from .models import Transaction, Category
from .serializers import RegisterSerializer, TransactionSerializer, CategorySerializer

# FBV 1
@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created"}, status=201)
    return Response(serializer.errors, status=400)

# FBV 2
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_summary(request):
    total_income = Transaction.objects.total_by_user(request.user, 'income')
    total_expense = Transaction.objects.total_by_user(request.user, 'expense')
    return Response({
        'total_income': total_income,
        'total_expense': total_expense,
        'balance': total_income - total_expense
    })

# CBV 1
class TransactionListCreate(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by('-date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = TransactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# CBV 2
class TransactionDetail(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        try:
            transaction = Transaction.objects.get(pk=pk, user=request.user)
            transaction.delete()
            return Response(status=204)
        except Transaction.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

# CBV category list
class CategoryList(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)