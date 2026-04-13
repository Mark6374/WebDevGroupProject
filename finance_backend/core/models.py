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
    date = models.DateField(auto_now_add=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    
    objects = TransactionManager()
    
    def __str__(self):
        return f"{self.user.username} - {self.amount}"

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    monthly_limit = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField()