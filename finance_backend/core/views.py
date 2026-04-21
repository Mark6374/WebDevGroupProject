from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from decimal import Decimal
from .models import Transaction, Category, CryptoHolding, CryptoTransaction, UserProfile
from .serializers import RegisterSerializer, TransactionSerializer, CategorySerializer, CryptoHoldingSerializer, CryptoTransactionSerializer


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
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_summary(request):
    total_income = Transaction.objects.total_by_user(request.user, 'income')
    total_expense = Transaction.objects.total_by_user(request.user, 'expense')
    total_crypto = Transaction.objects.total_by_user(request.user, 'crypto')

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'balance': Decimal('50000')}
    )

    return Response({
        'total_income': total_income,
        'total_expense': total_expense,
        'total_crypto': total_crypto,
        'balance': float(profile.balance),
    })

# FBV buy crypto

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buy_crypto(request):
    sym = request.data.get('symbol')
    amount = request.data.get('amount')
    price_usd = request.data.get('price_usd')

    if not sym or amount is None or price_usd is None:
        return Response({'error': 'symbol, amount and price_usd are required'}, status=400)

    try:
        amount    = Decimal(str(amount))
        price_usd = Decimal(str(price_usd))
    except Exception:
        return Response({'error': 'Invalid amount or price_usd'}, status=400)

    KZT_RATE = Decimal('470')
    cost_kzt = amount * price_usd * KZT_RATE

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'balance': Decimal('50000'), 'xp': 0}
    )

    if profile.balance < cost_kzt:
        return Response({'error': 'Insufficient balance'}, status=400)

    profile.balance = profile.balance - cost_kzt
    profile.xp = profile.xp + int(amount * price_usd * Decimal('0.5'))
    profile.save()

    holding, _ = CryptoHolding.objects.get_or_create(
        user=request.user, symbol=sym,
        defaults={'amount': Decimal('0'), 'invested_usd': Decimal('0')}
    )
    holding.amount = holding.amount + amount
    holding.invested_usd = holding.invested_usd + (amount * price_usd)
    holding.save()

    CryptoTransaction.objects.create(
        user=request.user, symbol=sym,
        amount_coin=amount, price_usd=price_usd,
        cost_kzt=cost_kzt, trade_type='buy',
    )

    crypto_cat, _ = Category.objects.get_or_create(
        name='Крипто-покупка', defaults={'type': 'expense'}
    )
    Transaction.objects.create(
        user=request.user,
        category=crypto_cat,
        amount=cost_kzt,
        description=f'Purchased {amount} {sym} at ${price_usd}',
        transaction_type='expense',
    )

    return Response({
        'message': 'Bought successfully',
        'new_balance': str(profile.balance),
        'xp': profile.xp,
        'xp_gained': int(amount * price_usd * Decimal('0.5')),
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sell_crypto(request):
    sym = request.data.get('symbol')
    amount = request.data.get('amount')
    price_usd = request.data.get('price_usd')

    if not sym or amount is None or price_usd is None:
        return Response({'error': 'symbol, amount and price_usd are required'}, status=400)

    try:
        amount    = Decimal(str(amount))
        price_usd = Decimal(str(price_usd))
    except Exception:
        return Response({'error': 'Invalid amount or price_usd'}, status=400)

    try:
        holding = CryptoHolding.objects.get(user=request.user, symbol=sym)
    except CryptoHolding.DoesNotExist:
        return Response({'error': f'You have no {sym} to sell'}, status=400)

    if holding.amount < amount:
        return Response({
            'error': f'Not enough {sym}. You have {holding.amount}'
        }, status=400)

    KZT_RATE  = Decimal('470')
    revenue_kzt = amount * price_usd * KZT_RATE

    avg_price  = holding.invested_usd / holding.amount if holding.amount > 0 else Decimal('0')
    profit_usd  = (price_usd - avg_price) * amount
    xp_gained  = max(0, int(float(profit_usd) * 1.0))

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'balance': Decimal('50000'), 'xp': 0}
    )
    profile.balance = profile.balance + revenue_kzt
    profile.xp = profile.xp + xp_gained
    profile.save()

    proportion            = amount / holding.amount
    holding.invested_usd  = holding.invested_usd - (holding.invested_usd * proportion)
    holding.amount        = holding.amount - amount
    if holding.amount <= Decimal('0.00000001'):
        holding.delete()
    else:
        holding.save()

    CryptoTransaction.objects.create(
        user=request.user, symbol=sym,
        amount_coin=amount, price_usd=price_usd,
        cost_kzt=revenue_kzt, trade_type='sell',
    )

    crypto_cat, _ = Category.objects.get_or_create(
        name='Crypto Sale', defaults={'type': 'income'}
    )
    Transaction.objects.create(
        user=request.user,
        category=crypto_cat,
        amount=revenue_kzt,
        description=f'Sold {amount} {sym} at ${price_usd}',
        transaction_type='income',
    )

    return Response({
        'message': 'Sold successfully',
        'new_balance': str(profile.balance),
        'revenue_kzt': str(revenue_kzt),
        'profit_usd': str(profit_usd),
        'xp': profile.xp,
        'xp_gained': xp_gained,
    }, status=200)

# CBV - crypto wallet
class CryptoWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        holdings = CryptoHolding.objects.filter(user=request.user)
        txs = CryptoTransaction.objects.filter(user=request.user).order_by('-date')
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response({
            'holdings': CryptoHoldingSerializer(holdings, many=True).data,
            'transactions': CryptoTransactionSerializer(txs, many=True).data,
            'xp': profile.xp,
            'rank': profile.get_rank(),
            'balance': profile.balance,
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def topup_balance(request):
    amount = request.data.get('amount')
    if not amount:
        return Response({'error': 'amount required'}, status=400)
    try:
        amount = Decimal(str(amount))
    except Exception:
        return Response({'error': 'Invalid amount'}, status=400)
    if amount <= 0:
        return Response({'error': 'Amount must be positive'}, status=400)

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'balance': Decimal('50000')}
    )
    profile.balance += amount
    profile.save()

    return Response({
        'message': 'Баланс толтырылды',
        'new_balance': str(profile.balance)
    }, status=200)