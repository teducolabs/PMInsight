using System.Linq.Expressions;

namespace PMInsight.Application.Common.Extensions;

public static class ExpressionExtensions
{
    public static Expression<Func<T, bool>> And<T>(
        this Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        var parameter = first.Parameters[0];
        var body = Expression.AndAlso(first.Body, Expression.Invoke(second, parameter));
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }

    public static Expression<Func<T, bool>> Or<T>(
        this Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        var parameter = first.Parameters[0];
        var body = Expression.OrElse(first.Body, Expression.Invoke(second, parameter));
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }
}