namespace HomeBudget.API.DTOs
{
    public class BudgetResponseDto
    {
        public int Id { get; set; }

        public int ExpenseCategoryId { get; set; }

        public string ExpenseCategoryName { get; set; } = string.Empty;

        public int Month { get; set; }

        public int Year { get; set; }

        public decimal Amount { get; set; }

        public decimal Spent { get; set; }

        public decimal Remaining => Amount - Spent;

        public decimal UsagePercentage =>
            Amount > 0
                ? decimal.Round(Spent / Amount * 100, 2)
                : 0;

        public string Status =>
            Spent > Amount ? "Over budget" :
            Spent == Amount ? "Fully spent" :
            Spent >= Amount * 0.8m ? "Near limit" :
            "Within budget";

        public string? Notes { get; set; }
    }
}