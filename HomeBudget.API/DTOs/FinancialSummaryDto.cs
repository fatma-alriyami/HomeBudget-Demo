namespace HomeBudget.API.DTOs
{
    public class FinancialSummaryDto
    {
        public DateTime FromDate { get; set; }

        public DateTime ToDate { get; set; }

        public decimal TotalIncome { get; set; }

        public decimal TotalExpenses { get; set; }

        public decimal NetAmount => TotalIncome - TotalExpenses;

        public int IncomeCount { get; set; }

        public int ExpenseCount { get; set; }
    }
}