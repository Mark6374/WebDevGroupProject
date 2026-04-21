from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum

class TransactionManager(models.Manager):
    def total_by_user(self, user, t_type):
        return self.filter(user=user, transaction_type=t_type).aggregate(Sum('amount'))['amount__sum'] or 0

class Category(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=[('income', 'Income'), ('expense', 'Expense')])
    
    def __str__(self):
        return self.name

class Transaction(models.Model):
    TRANSACTION_TYPES = [('income', 'Income'), ('expense', 'Expense')]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    
    objects = TransactionManager()
    
    def __str__(self):
        return f"{self.user.username} - {self.amount}"

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    monthly_limit = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField()

class CryptoHolding(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symbol = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    invested_usd = models.DecimalField(max_digits=15, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} - {self.symbol}"

class CryptoTransaction(models.Model):
    TRADE_TYPES = [('buy', 'Buy'), ('sell', 'Sell')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symbol = models.CharField(max_length=20)
    amount_coin = models.DecimalField(max_digits=20, decimal_places=8)
    price_usd = models.DecimalField(max_digits=15, decimal_places=2)
    cost_kzt = models.DecimalField(max_digits=15, decimal_places=2)
    trade_type= models.CharField(max_length=4, choices=TRADE_TYPES, default='buy')
    date = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user.username} bought {self.amount_coin} {self.symbol}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=50000)

    def get_rank(self):
        if self.xp >= 7000: return 'diamond'
        if self.xp >= 3500: return 'platinum'
        if self.xp >= 1500: return 'gold'
        if self.xp >= 500: return 'silver'
        return 'bronze'