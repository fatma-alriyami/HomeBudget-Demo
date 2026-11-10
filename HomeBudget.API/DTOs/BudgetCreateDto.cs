using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.DTOs
{
    public class BudgetCreateDto
    {
        [Range(1, int.MaxValue)]
        public int ExpenseCategoryId { get; set; }

        [Range(1, 12)]
        public int Month { get; set; }

        [Range(2000, 2100)]
        public int Year { get; set; }

        [Range(typeof(decimal), "0.001", "999999999999999.999")]
        public decimal Amount { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}